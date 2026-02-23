from sentence_transformers import SentenceTransformer
import time

print("Start")
t0 = time.time()
model = SentenceTransformer("all-MiniLM-L6-v2")
print(f"Model loaded in {time.time()-t0:.2f}s")
vec = model.encode("Hello world")
print(f"Encoded in {time.time()-t0:.2f}s")
print("Vector shape:", vec.shape)
