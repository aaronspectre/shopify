import requests

def browse():
	html = requests.get("https://tut.market")
	print(str(html.content).replace("\n", '\
'))

browse()

# with open("tut.market.html", "r") as file:
# 	print(file.read().index("Artboard3"))