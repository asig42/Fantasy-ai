#!/bin/bash
# ============================================================
# Fantasy AI - GCP Compute Engine 배포 스크립트
# 지원: Debian 12 / Ubuntu 22.04 (e2-micro Always Free)
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 1. 스왑 설정 (e2-micro 1GB RAM 부족 방지) ───────────────
setup_swap() {
  if swapon --show | grep -q '/swapfile'; then
    info "스왑 이미 설정됨"
    return
  fi
  info "스왑 2GB 설정 중 (e2-micro 메모리 부족 방지)..."
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=128M count=16
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab >/dev/null
  info "스왑 설정 완료 ($(free -h | awk '/Swap/{print $2}'))"
}

# ── 2. Docker 설치 ──────────────────────────────────────────
install_docker() {
  if command -v docker &>/dev/null; then
    info "Docker 이미 설치됨: $(docker --version)"
    sudo systemctl enable docker 2>/dev/null || true
    sudo systemctl start  docker 2>/dev/null || true
    return
  fi

  info "Docker 설치 중..."
  if command -v apt-get &>/dev/null; then
    # Debian / Ubuntu (GCP 기본)
    sudo apt-get update -qq
    curl -fsSL https://get.docker.com | sudo sh
  elif command -v yum &>/dev/null; then
    sudo yum install -y docker
  else
    error "지원하지 않는 OS입니다."
  fi

  sudo systemctl enable docker
  sudo systemctl start  docker
  sudo usermod -aG docker "$USER"
  info "Docker 설치 완료"
}

# ── 3. Docker Compose 설치 ──────────────────────────────────
install_compose() {
  if docker compose version &>/dev/null 2>&1; then
    info "Docker Compose 이미 설치됨"
    return
  fi
  info "Docker Compose 설치 중..."
  ARCH=$(uname -m)
  COMPOSE_VERSION="v2.27.0"
  sudo curl -fsSL \
    "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
  info "Docker Compose 설치 완료"
}

# ── 4. .env 파일 설정 ────────────────────────────────────────
setup_env() {
  if [ -f .env ] && grep -q 'sk-ant-' .env 2>/dev/null; then
    info ".env 파일이 이미 설정되어 있습니다."
    return
  fi

  [ -f .env.example ] || error ".env.example 파일이 없습니다. 프로젝트 루트에서 실행해주세요."
  [ -f .env ] || cp .env.example .env

  echo ""
  echo "  ┌─────────────────────────────────────┐"
  echo "  │   API 키 설정                        │"
  echo "  │   필수: Anthropic API Key            │"
  echo "  │   선택: fal.ai Key (이미지 생성용)   │"
  echo "  └─────────────────────────────────────┘"
  echo ""
  read -rp "  ANTHROPIC_API_KEY (sk-ant-...): " anthropic_key
  [ -z "$anthropic_key" ] && error "Anthropic API 키는 필수입니다."
  sed -i "s|your_anthropic_api_key_here|${anthropic_key}|g" .env

  read -rp "  FAL_KEY (없으면 Enter): " fal_key
  if [ -n "$fal_key" ]; then
    sed -i "s|your_fal_ai_key_here|${fal_key}|g" .env
  fi
  info ".env 설정 완료"
}

# ── 5. 앱 빌드 & 실행 ────────────────────────────────────────
start_app() {
  info "앱 빌드 및 시작 중... (최초 빌드 5~10분 소요)"

  # Docker 그룹 권한 적용 (새로 추가된 경우)
  if ! groups | grep -q docker; then
    exec sg docker "$0 --skip-setup"
  fi

  docker compose down 2>/dev/null || true
  docker compose up -d --build

  info "컨테이너 상태 확인..."
  sleep 8
  docker compose ps
}

# ── 공인 IP 조회 (GCP 메타데이터 서버 우선) ─────────────────
get_public_ip() {
  curl -s --connect-timeout 3 \
    -H "Metadata-Flavor: Google" \
    "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip" \
    2>/dev/null || \
  curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || \
  echo "YOUR_VM_IP"
}

# ── 메인 ─────────────────────────────────────────────────────
main() {
  if [[ "${1:-}" == "--skip-setup" ]]; then
    start_app
    return
  fi

  echo ""
  echo "╔════════════════════════════════════════════╗"
  echo "║  Fantasy AI - GCP Compute Engine 배포      ║"
  echo "╚════════════════════════════════════════════╝"
  echo ""

  cd "$(dirname "$(realpath "$0")")"

  setup_swap
  install_docker
  install_compose
  setup_env
  start_app

  PUBLIC_IP=$(get_public_ip)

  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║              배포 완료!                      ║"
  echo "╠══════════════════════════════════════════════╣"
  printf "║  접속 주소: http://%-26s║\n" "${PUBLIC_IP}:3000"
  echo "║                                              ║"
  echo "║  로그 확인:  docker compose logs -f          ║"
  echo "║  재시작:     docker compose restart          ║"
  echo "║  중지:       docker compose down             ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  warn "GCP 콘솔 → VPC 네트워크 → 방화벽 → 규칙 만들기"
  warn "  이름: allow-fantasy-ai"
  warn "  트래픽 방향: 수신 / 작업: 허용"
  warn "  대상: 모든 인스턴스 / 소스: 0.0.0.0/0"
  warn "  프로토콜 및 포트: TCP 3000"
  echo ""
}

main "$@"
