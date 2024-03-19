import os
import re
import nltk
from pathlib import Path
import markdown
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

nltk.download('punkt')
nltk.download('wordnet')
nltk.download('stopwords')

stop_words = set(stopwords.words('english'))

file_path = ".."
words = []
frequencies = []
markdown_text = []
tokens = []
tokens_lemma = []
tokens_punct = []
unique_tokens = []
seen = set()

def markdown_directory_to_bag_of_words(path):
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
    symbols = ['','.',":","'s","(",")","","[","]",None,"’",",","`"]

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

            filtered_tokens = [w for w in [item for row in tokens for item in row] if not w in stop_words]
            tokens_punct = [w for w in filtered_tokens if w not in symbols]

            # lemming
            for token in tokens_punct:
                tokens_lemma.append(lemmatizer.lemmatize(token))

            # remove duplicate words
            for token in tokens_lemma:
                if token not in seen:
                    unique_tokens.append(token)
                    seen.add(token)

            return unique_tokens
    except:
        print("Unable to load Zettelkasten files...")
    else:
        print("Keywords Extraction Successful!")

if __name__ == "__main__":
    # Save Report
    with open(f"{file_path}/output/keyword report.txt", 'w') as file:
        for item in markdown_directory_to_bag_of_words(f"{file_path}/Zettelkasten/"):
            file.write(f"{item}\n")