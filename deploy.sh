#!/bin/bash
# ============================================================
# Fantasy AI - 서버 배포 스크립트
# 지원: Oracle Cloud Ubuntu 22.04 / AWS EC2 Amazon Linux 2
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 1. Docker 설치 ──────────────────────────────────────────
install_docker() {
  if command -v docker &>/dev/null; then
    info "Docker 이미 설치됨: $(docker --version)"
    return
  fi

  info "Docker 설치 중..."
  if command -v apt-get &>/dev/null; then
    # Ubuntu / Debian
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
  elif command -v yum &>/dev/null; then
    # Amazon Linux / CentOS
    sudo yum install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker "$USER"
  else
    error "지원하지 않는 OS입니다. Docker를 수동으로 설치해주세요."
  fi
  info "Docker 설치 완료"
}

# ── 2. Docker Compose 설치 ──────────────────────────────────
install_compose() {
  if docker compose version &>/dev/null 2>&1; then
    info "Docker Compose 이미 설치됨"
    return
  fi

  info "Docker Compose 설치 중..."
  COMPOSE_VERSION="v2.27.0"
  sudo curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
  info "Docker Compose 설치 완료"
}

# ── 3. 방화벽 포트 열기 ──────────────────────────────────────
open_firewall() {
  info "방화벽 포트 80, 443, 3000 열기..."
  if command -v ufw &>/dev/null; then
    sudo ufw allow 80/tcp   2>/dev/null || true
    sudo ufw allow 443/tcp  2>/dev/null || true
    sudo ufw allow 3000/tcp 2>/dev/null || true
    sudo ufw --force enable 2>/dev/null || true
  fi
  # Oracle Cloud / AWS는 iptables 직접 열기
  sudo iptables -I INPUT -p tcp --dport 80   -j ACCEPT 2>/dev/null || true
  sudo iptables -I INPUT -p tcp --dport 443  -j ACCEPT 2>/dev/null || true
  sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
  info "방화벽 설정 완료"
}

# ── 4. .env 파일 설정 ────────────────────────────────────────
setup_env() {
  if [ -f .env ]; then
    info ".env 파일이 이미 존재합니다."
    return
  fi

  if [ ! -f .env.example ]; then
    error ".env.example 파일이 없습니다. 프로젝트 루트에서 실행해주세요."
  fi

  cp .env.example .env
  warn ".env 파일을 생성했습니다. API 키를 설정해주세요:"
  echo ""
  echo "  nano .env"
  echo ""
  echo "  필수: ANTHROPIC_API_KEY=sk-ant-..."
  echo "  선택: FAL_KEY=... (이미지 생성용)"
  echo ""
  read -rp "API 키를 지금 설정하시겠습니까? (y/N): " answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    read -rp "ANTHROPIC_API_KEY: " anthropic_key
    sed -i "s|your_anthropic_api_key_here|${anthropic_key}|g" .env
    read -rp "FAL_KEY (없으면 Enter): " fal_key
    if [ -n "$fal_key" ]; then
      sed -i "s|your_fal_ai_key_here|${fal_key}|g" .env
    fi
    info ".env 설정 완료"
  fi
}

# ── 5. 앱 빌드 & 실행 ────────────────────────────────────────
start_app() {
  info "앱 빌드 및 시작 중... (최초 빌드는 5-10분 소요)"

  # 기존 컨테이너 정지 (있으면)
  docker compose down 2>/dev/null || true

  # 빌드 & 백그라운드 실행
  docker compose up -d --build

  info "컨테이너 상태 확인 중..."
  sleep 5
  docker compose ps
}

# ── 메인 ─────────────────────────────────────────────────────
main() {
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║     Fantasy AI - 배포 스크립트       ║"
  echo "╚══════════════════════════════════════╝"
  echo ""

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"

  install_docker
  install_compose
  open_firewall
  setup_env
  start_app

  PUBLIC_IP=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║           배포 완료!                     ║"
  echo "╠══════════════════════════════════════════╣"
  echo "║  접속 주소: http://${PUBLIC_IP}:3000"
  echo "║"
  echo "║  로그 확인:  docker compose logs -f"
  echo "║  재시작:     docker compose restart"
  echo "║  중지:       docker compose down"
  echo "╚══════════════════════════════════════════╝"
  echo ""
  warn "Oracle Cloud: 콘솔 → VCN → Security List에서 3000 포트 인그레스 규칙 추가 필요"
  warn "AWS EC2:      Security Group에서 3000 포트 인바운드 규칙 추가 필요"
}

main "$@"
