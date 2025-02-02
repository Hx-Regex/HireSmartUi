import spacy
from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from sentence_transformers import SentenceTransformer
import numpy as np
from .utils import splitter

# Load spaCy NER model
nlp = spacy.load("en_core_web_sm")

# Load Hugging Face NER model
tokenizer = AutoTokenizer.from_pretrained("dslim/bert-base-NER")
model = AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")
transformer_ner = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")

# Load SentenceTransformer model for context-aware matching
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

# Example IT dictionary - can be extended
IT_DICTIONARY = [
  "Python",
  "Java",
  "Docker",
  "AWS",
  "Kubernetes",
  "React",
  "SQL",
  "Django",
  "Flask",
  "Node.js",
  "Machine Learning",
  "JavaScript",
  "TypeScript",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Swift",
  "Go",
  "Rust",
  "Scala",
  "Kotlin",
  "R",
  "MATLAB",
  "HTML",
  "CSS",
  "Angular",
  "Vue.js",
  "Svelte",
  "Express.js",
  "Spring Boot",
  "Laravel",
  "Ruby on Rails",
  "ASP.NET",
  "GraphQL",
  "REST API",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Oracle",
  "Redis",
  "Elasticsearch",
  "Cassandra",
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Jenkins",
  "Travis CI",
  "CircleCI",
  "Ansible",
  "Terraform",
  "Puppet",
  "Chef",
  "Nginx",
  "Apache",
  "Linux",
  "Unix",
  "Windows Server",
  "macOS",
  "iOS",
  "Android",
  "React Native",
  "Flutter",
  "Xamarin",
  "TensorFlow",
  "PyTorch",
  "Keras",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "SciPy",
  "NLTK",
  "OpenCV",
  "Hadoop",
  "Spark",
  "Hive",
  "Pig",
  "Flink",
  "Kafka",
  "RabbitMQ",
  "ZeroMQ",
  "Docker Swarm",
  "OpenShift",
  "Rancher",
  "Prometheus",
  "Grafana",
  "ELK Stack",
  "Splunk",
  "New Relic",
  "Datadog",
  "Sentry",
  "Jira",
  "Confluence",
  "Trello",
  "Asana",
  "Slack",
  "Microsoft Teams",
  "Zoom",
  "WebRTC",
  "Socket.io",
  "WebSockets",
  "Redux",
  "MobX",
  "Vuex",
  "NgRx",
  "Webpack",
  "Babel",
  "ESLint",
  "Prettier",
  "Jest",
  "Mocha",
  "Chai",
  "Cypress",
  "Selenium",
  "Puppeteer",
  "Agile",
  "Scrum",
  "Kanban",
  "DevOps",
  "CI/CD",
  "Microservices",
  "Serverless",
  "Blockchain",
  "Ethereum",
  "Solidity",
  "WebAssembly",
  "AR/VR",
  "Unity",
  "Unreal Engine",
  "Power BI",
  "Tableau",
  "NLP",
  "Computer Vision",
  "Big Data",
  "Data Science",
  "Artificial Intelligence",
  "Deep Learning",
  "Reinforcement Learning",
  "IoT",
  "Embedded Systems",
  "FPGA",
  "VHDL",
  "Verilog",
  "LangChain",
  "AraBERT",
  "AraBERT-CRF",
  "SpaCy",
  "MidJourney",
  "TensorFlow",
  "PyTorch",
  "Notebooks",
  "Random Forest",
  "LLM",
  "API",
  "NER",
]





# Function for context-aware matching of IT skills using sentence embeddings
def context_aware_matching(text, dictionary, threshold=0.7):
    """Match IT skills using sentence embeddings for more context-aware matching"""
    embeddings = sentence_model.encode([text] + dictionary)
    text_embedding = embeddings[0]
    dictionary_embeddings = embeddings[1:]

    similarities = [np.dot(text_embedding, emb) / (np.linalg.norm(text_embedding) * np.linalg.norm(emb)) for emb in dictionary_embeddings]
    matched_skills = [dictionary[i] for i, sim in enumerate(similarities) if sim > threshold]
    return matched_skills



def extract_entities(text):
    """
    Extracts entities using spaCy and Hugging Face NER models, and performs IT-specific skill matching.
    """
    # Step 1: Process text in chunks for performance
    chunks = splitter(text)

    # Initialize lists for entities and matched skills
    all_entities_spacy = []
    all_entities_transformers = []
    all_matched_skills = set()

    for chunk in chunks:
        # Extract the text content from the Document object
        chunk_text = chunk.page_content
        # Extract entities using spaCy NER
        doc = nlp(chunk_text)
        entities_spacy = [(ent.text, ent.label_) for ent in doc.ents]

        # Extract domain-specific entities with Hugging Face NER
        entities_transformers = transformer_ner(chunk_text)
        domain_entities = {entity['entity_group']: entity['word'] for entity in entities_transformers}

        # Extract IT-specific skills using context-aware matching
        matched_skills = context_aware_matching(chunk_text, IT_DICTIONARY)

        # Append results
        all_entities_spacy.extend(entities_spacy)
        all_entities_transformers.extend(domain_entities.items())
        all_matched_skills.update(matched_skills)

    # Merge spaCy and Hugging Face results and remove duplicates
    combined_entities = all_entities_spacy + all_entities_transformers
    combined_entities = list({(text, label): (text, label) for text, label in combined_entities}.values())  

    # Advanced filtering (can be customized based on domain)
    filtered_entities = [entity for entity in combined_entities if entity[1] in ['ORG', 'GPE', 'DATE', 'MISC']]  

    return {
        "Entities (spaCy)": filtered_entities,
        "Entities (Transformers)": dict(all_entities_transformers),
        "Skills": list(all_matched_skills),  
    }
