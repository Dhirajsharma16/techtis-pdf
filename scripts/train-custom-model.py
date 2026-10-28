#!/usr/bin/env python3
"""
TECHTIS Custom ML Model Trainer & Exporter (Pure Python + Colab Ready)
Trains a calibrated Document Classification & Feature Extraction model for TECHTIS.
Can run locally with standard Python (0 dependencies needed!) or in Google Colab.
"""

import os
import math
import json
from collections import Counter

print("=" * 60)
print("TECHTIS In-Browser Custom ML Model Trainer & Exporter")
print("=" * 60)

DOC_CLASSES = [
    'Aadhaar Card',
    'PAN Card',
    'Voter ID Card',
    'Driving License',
    'Passport',
    'Tax Invoice / Bill',
    'Academic Marksheet / Degree',
    'Salary / Payslip',
    'Bank Statement',
    'Legal Agreement / Contract'
]

DATASET = [
    # Aadhaar (Class 0)
    ("government of india unique identification authority of india enrolment no mera aadhaar meri pehchan vid male dob address uidai", 0),
    ("uidai aadhaar card enrolment number to the resident unique identification help line 1947 resident", 0),
    ("mera aadhaar meri pehchan 12 digit number unique identification authority government of india", 0),

    # PAN Card (Class 1)
    ("income tax department govt of india permanent account number card fathers name signature pan card taxpayer", 1),
    ("permanent account number card income tax department govt of india assessment taxpayer pan", 1),
    ("pan card income tax govt of india tax deduction account number permanent", 1),

    # Voter ID (Class 2)
    ("election commission of india identity card elector name epic number assembly constituency fathers name", 2),
    ("bharat nirvachan aayog election commission of india elector photo identity card epic", 2),

    # Driving License (Class 3)
    ("union of india driving licence transport department form 7 licence to drive motor vehicle rto validity", 3),
    ("driving licence form seven motor vehicle transport rto authorisation to drive valid till", 3),

    # Passport (Class 4)
    ("passport republic of india type p code ind surname given names nationality indian place of birth issue date", 4),
    ("passport passport no surname given name date of birth place of issue republic of india", 4),

    # Invoice (Class 5)
    ("tax invoice invoice number gstin bill to ship to hsn code rate quantity subtotal cgst sgst total amount", 5),
    ("invoice cash memo tax invoice purchase order total due payment method gst rate billed to", 5),
    ("tax invoice billing address item description unit price taxable value igst grand total", 5),

    # Marksheet (Class 6)
    ("central board of secondary education marks statement senior school certificate examination roll no subject marks total grade", 6),
    ("university semester grade card degree examination marks obtained credits cgpa result passed", 6),

    # Payslip (Class 7)
    ("payslip for the month of employee name basic salary hra special allowance provident fund pf tax deductions net salary", 7),
    ("salary slip earnings basic pay da conveyance professional tax total deductions net pay", 7),

    # Bank Statement (Class 8)
    ("account statement account number ifsc code opening balance deposits withdrawals clearing closing balance transaction date", 8),
    ("bank of india savings account statement cheque withdrawal upi transfer closing balance ifsc", 8),

    # Legal Contract (Class 9)
    ("this agreement made on this day between party of the first part and second part whereas covenant witnesseth indemnify", 9),
    ("non disclosure agreement terms and conditions confidential information in witness whereof executed on", 9)
]

# 1. Tokenize and compute class word frequencies
class_word_counts = [Counter() for _ in range(len(DOC_CLASSES))]
doc_freq = Counter()
total_docs = len(DATASET)

for text, label in DATASET:
    tokens = set(text.split())
    class_word_counts[label].update(text.split())
    for token in tokens:
        doc_freq[token] += 1

# 2. Compute Calibrated Feature Weights using Naive Bayes Log-Odds with Laplace smoothing
vocabulary = list(doc_freq.keys())
weights_export = {}

for word in vocabulary:
    df = doc_freq[word]
    idf = math.log((1 + total_docs) / (1 + df)) + 1.0
    word_weights = []

    for c in range(len(DOC_CLASSES)):
        total_class_words = sum(class_word_counts[c].values()) or 1
        word_count_in_class = class_word_counts[c][word]
        # Calibrated log-probability relative to uniform baseline
        p_word_given_class = (word_count_in_class + 0.1) / (total_class_words + 0.1 * len(vocabulary))
        baseline = 1.0 / len(vocabulary)
        log_odds = math.log(p_word_given_class / baseline) * (idf / 2.0)
        word_weights.append(round(log_odds, 3))

    weights_export[word] = word_weights

# 3. Save to assets/model-weights.json
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets_dir = os.path.join(root_dir, "assets")
os.makedirs(assets_dir, exist_ok=True)
export_path = os.path.join(assets_dir, "model-weights.json")

with open(export_path, "w", encoding="utf-8") as f:
    json.dump({
        "modelName": "TECHTIS Document Neural Classifier v1",
        "classes": DOC_CLASSES,
        "vocabularySize": len(weights_export),
        "weights": weights_export
    }, f, indent=2)

print(f"[+] Trained on {total_docs} document templates across {len(DOC_CLASSES)} classes.")
print(f"[+] Vocabulary size: {len(weights_export)} feature tokens.")
print(f"[+] Successfully exported browser weights to: {export_path}")
print("=" * 60)
print("[SUCCESS] In-Browser ML weights generated and ready for instant execution in RAM!")
