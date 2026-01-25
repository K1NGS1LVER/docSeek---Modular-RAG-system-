from sentence_transformers import SentenceTransformer
import sys


def main():
    # Load the model
    print("Loading model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded.")

    # Check if arguments were passed
    if len(sys.argv) > 1:
        sentences = sys.argv[1:]
        embeddings = model.encode(sentences)
        # If only one sentence, embeddings is 1D array, if multiple, it's 2D.
        # model.encode returns a list of ndarrays or a single ndarray depending on input.
        # But when passing a list, it returns an array of embeddings.

        # Ensure we iterate correctly
        if isinstance(sentences, list):
            # If a list of sentences is passed, embeddings is a 2D numpy array
            for sentence, embedding in zip(sentences, embeddings):
                print(f"\nSentence: {sentence}")
                print(f"Vector (shape {embedding.shape}):")
                print(embedding)
                print("-" * 20)
    else:
        # Interactive mode
        print("\nEnter sentences to embed (Press Ctrl+C or type 'exit' to quit):")
        try:
            while True:
                sentence = input("\nInput sentence: ")
                if sentence.lower() == "exit":
                    break
                if not sentence:
                    continue
                embedding = model.encode(sentence)
                print(f"Vector (shape {embedding.shape}):")
                print(embedding)
        except KeyboardInterrupt:
            print("\nExiting...")


if __name__ == "__main__":
    main()
