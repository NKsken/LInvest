from flask import Flask, render_template
from LInvestModule.Printer import Print

app = Flask(__name__, template_folder="LInvestForntend", static_folder="LInvestStatic")

@app.route('/<string:code>')

def home():
    return render_template('index.html')

app.run(debug=True)
