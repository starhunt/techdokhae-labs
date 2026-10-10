"""Local-only live search UI. Reads the example's saved index; no external inference."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
import argparse,hashlib,json,threading
import numpy as np
from sentence_transformers import SentenceTransformer
ROOT=Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(ROOT),**kw)
 def reply(self,status,data):
  body=json.dumps(data,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_GET(self):
  if urlparse(self.path).path=='/api/health':return self.reply(200,dict(live=True,device='cpu',model=self.server.meta['model']))
  return super().do_GET()
 def do_POST(self):
  if self.path!='/api/query':return self.reply(404,dict(error='Unknown route'))
  try:
   n=int(self.headers.get('Content-Length','0'))
   if not 0<n<=8192:raise ValueError('Invalid request size')
   req=json.loads(self.rfile.read(n));query=req.get('query','').strip();dim=int(req.get('dimension',768));kind=req.get('kind','all')
   if not query or len(query)>1000 or dim not in [128,256,768] or kind not in ['all','image','text']:raise ValueError('Invalid query, dimension or type')
   with self.server.model_lock:v=np.asarray(self.server.model.encode(query,prompt_name='SearchQuery',normalize_embeddings=True)).reshape(-1)[:dim]
   v=v/max(np.linalg.norm(v),1e-12);matrix=self.server.vectors[:,:dim];matrix=matrix/np.maximum(np.linalg.norm(matrix,axis=1,keepdims=True),1e-12);scores=matrix@v
   rows=[dict(id=self.server.meta['items'][i]['id'],kind=self.server.meta['items'][i]['kind'],score=float(scores[i])) for i in np.argsort(-scores) if kind=='all' or self.server.meta['items'][i]['kind']==kind]
   return self.reply(200,dict(text=query,rankings={str(dim):rows},live=True))
  except (ValueError,KeyError,TypeError,json.JSONDecodeError) as e:return self.reply(400,dict(error=str(e)))
  except Exception:return self.reply(500,dict(error='Local inference failed; inspect server log'))
def main():
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8854);a=p.parse_args();meta=json.loads((ROOT/'index-metadata.json').read_text())
 for item in meta['items']:
  path=ROOT/item['path']
  if hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:raise ValueError('Changed source: '+item['path']+'; run search.py to rebuild index')
 vectors=np.load(ROOT/'vectors.npz')['documents'];assert vectors.shape==(len(meta['items']),768) and np.isfinite(vectors).all()
 model=SentenceTransformer(meta['model'],revision=meta['revision'],config_kwargs={'audio_config':None,'vision_config':None},device='cpu');model.eval()
 server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler);server.model=model;server.meta=meta;server.vectors=vectors;server.model_lock=threading.Lock();print(f'LIVE SEARCH READY http://127.0.0.1:{a.port}/app.html',flush=True);server.serve_forever()
if __name__=='__main__':main()
