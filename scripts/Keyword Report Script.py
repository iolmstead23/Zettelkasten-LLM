import os
import re
import nltk
import time
import markdown
from pathlib import Path
from collections import Counter
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')

stop_words = set(stopwords.words('english'))

file_path = ".."
word_freq = []
markdown_text = []
tokens = []
tokens_lemma = []
tokens_punct = []
unique_tokens = []
seen = set()

def markdown_directory_to_keywords(path, unique):
    """
    Converts a markdown file into a bag of words.

    Args:
        markdown_file: The path to the markdown file.

    Returns:
        A list of words in the markdown file.
    """

    lemmatizer = WordNetLemmatizer()

    # initializing punctuations string
    punc = '''!()-[]{};:'"\,<>./?@#$%^&*_~'''
    symbols = ['','.',":","'s","(",")","","[","]",None,"’",",","`","--","|",";"]

    # Iterate through each file in the directory
    try:
        for filename in os.listdir(path):
            # Construct the full file path
            markdown_file = os.path.join(path, filename)

            # Check if it's a markdown file
            if Path(markdown_file).suffix == '.md':
                # Read the markdown file
                with open(markdown_file, 'r') as f:
                    # Convert the markdown to HTML
                    html = markdown.markdown(f.read())

                    # Remove all HTML tags
                    text = re.sub('<[^>]*>', '', html)
                    # Make sure keywords are lowercase
                    tokens.append(word_tokenize(text.lower()))

            # filter out stop words
            filtered_tokens = [w for w in [item for row in tokens for item in row] if not w in stop_words]

            #remove punctuation
            tokens_punct = [w for w in filtered_tokens if w not in symbols]

            # lemming
            for token in tokens_punct:
                tokens_lemma.append(lemmatizer.lemmatize(token))

            # count words
            word_counts = Counter(tokens_lemma)
            top_n_words = word_counts.most_common(100)

            for word, count in top_n_words:
                word_freq.append((word,count))

            # remove duplicate words
            for token in tokens_lemma:
                if token not in seen:
                    unique_tokens.append(token)
                    seen.add(token)
    except:
        print("Unable to load Zettelkasten files...")
    
    print("Keyword Extraction Successful.")

    if (unique):
        return len(unique_tokens)
    else: return word_freq

if __name__ == "__main__":
    # Save Report
    with open(f"{file_path}/output/keyword report.txt", 'w') as file:
        file.write(f"Unique Words: {markdown_directory_to_keywords(f'{file_path}/Zettelkasten/', True)}")
        file.write("\n\nTop 100 Words:\n\n")
        for n in sorted(markdown_directory_to_keywords(f"{file_path}/Zettelkasten/", False),key=lambda a: a[1], reverse=True):
            w, f = n
            file.write(f"{w}: {f}\n")
    os.system('pause')