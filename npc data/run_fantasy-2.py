#!/usr/bin/env python3
import json, time, random, sys, re, urllib.request, urllib.error
import threading, queue
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# ── 🔑 설정 ──
PORTS = [8188, 8189]
BASE_DIR = Path(__file__).parent.resolve()
WORKFLOW_PATH = BASE_DIR / "Unsaved Workflow-2.json"
PROMPTS_PATH = BASE_DIR / "prompts.json"
print_lock = threading.Lock()

# ── 순서 보장을 위한 카운터 ──
counter_lock = threading.Lock()
current_counter = [1]  # 리스트로 감싸서 스레드에서 수정 가능하게

def safe_print(msg):
    with print_lock: print(msg, flush=True)

def get_smart_workflow(prompt_text, output_name):
    with open(WORKFLOW_PATH, encoding="utf-8") as f:
        wf = json.load(f)
    
    # 🎯 노드 타입별로 ID 찾기 (CLIPTextEncode가 여러 개일 경우 긍정 프롬프트만)
    positive_node = None
    for k, v in wf.items():
        if v.get("class_type") == "CLIPTextEncode":
            # 네거티브 프롬프트가 아닌 첫 번째 노드 = 긍정 프롬프트
            text = v.get("inputs", {}).get("text", "")
            if "bad quality" not in text and "worst quality" not in text:
                positive_node = k
                break

    sampler_node = None
    save_node = None
    for k, v in wf.items():
        if v.get("class_type") == "KSampler":
            sampler_node = k
        if v.get("class_type") == "SaveImage":
            save_node = k

    # 1. 긍정 프롬프트 입력
    if positive_node:
        wf[positive_node]["inputs"]["text"] = f"masterpiece, best quality, cowboy shot, {prompt_text}"
    
    # 2. 시드값 변경 + 모델 연결 고정
    if sampler_node:
        wf[sampler_node]["inputs"]["seed"] = random.randint(1, 10**15)
        wf[sampler_node]["inputs"]["model"] = ["1", 0]
        
    # 3. 저장 경로 설정
    if save_node:
        wf[save_node]["inputs"]["filename_prefix"] = output_name

    return {k: {"inputs": v.get("inputs", {}), "class_type": v.get("class_type", "")} for k, v in wf.items()}

def submit_and_wait(prompt_text, output_name, port):
    url = f"http://127.0.0.1:{port}/prompt"
    try:
        api_wf = get_smart_workflow(prompt_text, output_name)
        data = json.dumps({"prompt": api_wf}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req) as resp:
            pid = json.loads(resp.read())["prompt_id"]
        
        while True:
            time.sleep(3)
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/history") as r:
                history = json.loads(r.read())
                if pid in history: return "SUCCESS"
    except Exception as e: return str(e)

def run_batch():
    prompts = json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))
    total = len(prompts)
    q = queue.Queue()
    [q.put(p) for p in PORTS]

    # 각 작업에 순번을 미리 할당 (1부터 시작)
    indexed_prompts = list(enumerate(prompts, start=1))

    def worker(seq, item):
        port = q.get()
        try:
            name = item.get('name', f'img_{seq}')
            raw_id = item.get('id', 'image')

            # 파일명: 순번_캐릭터명_씬명  (예: 001_엘리아나_portrait)
            # id 형식이 "캐릭터_씬" 이므로 그대로 활용
            safe_id = re.sub(r'[^a-zA-Z0-9가-힣]', '_', raw_id)
            output_name = f"{seq:03d}_{safe_id}"

            safe_print(f"[{seq}/{total}] 🎨 [Port {port}] 시작: {name}  →  {output_name}")
            res = submit_and_wait(item.get('prompt', ''), output_name, port)
            safe_print(f"    ✅ [{port}] {output_name} → {res}")
        finally:
            q.put(port)

    with ThreadPoolExecutor(max_workers=len(PORTS)) as executor:
        futures = [executor.submit(worker, seq, item) for seq, item in indexed_prompts]
        for f in futures:
            f.result()  # 예외 전파

if __name__ == "__main__":
    safe_print("🚀 Fantasy-AI Batch Generator")
    run_batch()
    safe_print("🎉 모든 작업 완료!")
