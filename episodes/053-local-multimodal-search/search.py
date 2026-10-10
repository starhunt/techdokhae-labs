"""Small local multimodal retrieval lab; synthetic corpus, not a general benchmark."""
from pathlib import Path
import argparse,datetime,hashlib,json,os,time,platform
import numpy as np
os.environ['TOKENIZERS_PARALLELISM']='false'
from sentence_transformers import SentenceTransformer
import torch,transformers,sentence_transformers
ROOT=Path(__file__).resolve().parent
MODEL='google/embeddinggemma-2';REVISION='914f7f89142e33e77833254d9c9b90c3cef7303b'
def normalized(a):return a/np.maximum(np.linalg.norm(a,axis=-1,keepdims=True),1e-12)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--device',default='cpu');args=parser.parse_args()
 data=json.loads((ROOT/'dataset.json').read_text());items=data['items'];tic=time.monotonic()
 model=SentenceTransformer(MODEL,revision=REVISION,config_kwargs={'audio_config':None},device=args.device)
 model.eval();print('MODEL READY',round(time.monotonic()-tic,2),flush=True)
 vectors=[];index_times=[]
 for item in items:
  start=time.monotonic()
  if item['kind']=='image':v=model.encode({'image':str(ROOT/item['path'])},normalize_embeddings=True)
  else:v=model.encode((ROOT/item['path']).read_text(),prompt_name='Document',normalize_embeddings=True)
  vectors.append(np.asarray(v).reshape(-1));index_times.append(time.monotonic()-start);print('INDEX',item['id'],vectors[-1].shape,round(index_times[-1],2),flush=True)
 matrix=np.stack(vectors);results=[];query_vectors=[]
 for q in data['queries']:
  start=time.monotonic();v=np.asarray(model.encode(q['text'],prompt_name='SearchQuery',normalize_embeddings=True)).reshape(-1);query_vectors.append(v);elapsed=time.monotonic()-start
  rankings={}
  for d in [768,256,128]:
   scores=normalized(matrix[:,:d])@normalized(v[:d]);order=np.argsort(-scores)
   rankings[str(d)]=[dict(id=items[i]['id'],kind=items[i]['kind'],score=float(scores[i])) for i in order]
  exact=[x['id'] for x in items if x['kind']=='text' and q['text'].casefold() in (ROOT/x['path']).read_text().casefold()]
  results.append({**q,'rankings':rankings,'querySeconds':elapsed,'literalTextMatches':exact});print('QUERY',q['id'],[(x['id'],round(x['score'],3)) for x in rankings['768'][:3]],flush=True)
 np.savez(ROOT/'vectors.npz',documents=matrix,queries=np.stack(query_vectors))
 result=dict(createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),model=MODEL,revision=REVISION,device=args.device,platform=platform.platform(),versions=dict(torch=torch.__version__,transformers=transformers.__version__,sentence_transformers=sentence_transformers.__version__),datasetSha256=hashlib.sha256((ROOT/'dataset.json').read_bytes()).hexdigest(),vectorShape=list(matrix.shape),indexSeconds=index_times,results=results,elapsedSeconds=time.monotonic()-tic,scope='12 self-authored items and 8 predeclared illustrative queries; not an accuracy benchmark. Image file names and descriptions are not model inputs. Cosine scores are not probabilities. Model fetched before local inference.')
 (ROOT/'index-metadata.json').write_text(json.dumps(dict(model=MODEL,revision=REVISION,dimensions=768,items=[{**x,'sha256':hashlib.sha256((ROOT/x['path']).read_bytes()).hexdigest()} for x in items]),ensure_ascii=False,indent=2))
 (ROOT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('DONE',round(time.monotonic()-tic,2),flush=True)
if __name__=='__main__':main()
