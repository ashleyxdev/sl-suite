from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("form.html")

@app.route("/submit", methods=["POST"])
def submit():
    name = request.form.get("name")
    email = request.form.get("email")
    event = request.form.get("event")
    return render_template("success.html", name=name, email=email, event=event)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)