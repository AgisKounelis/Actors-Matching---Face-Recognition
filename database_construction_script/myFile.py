import requests
import face_recognition
from PIL import Image
from io import BytesIO
import numpy
import sqlite3


url_popular = 'http://api.themoviedb.org/3/person/popular'
url_images = 'https://api.themoviedb.org/3/person/'
image_url_prefix = "https://image.tmdb.org/t/p/w500"
my_key = 'YOUR KEY'

conn = sqlite3.connect('database.db')
c = conn.cursor()


for pageNum in range(1, 101):
    params = dict(
        page=str(pageNum),
        language='en-US',
        api_key=my_key,
        sensor='false'
    )

    resp = requests.get(url=url_popular, params=params)
    data = resp.json()

    for i in range(0, 20):
        name = data['results'][i]['name'].replace("'", " ")
        id = data['results'][i]['id']
        face_landmarks_list = []
        if data['results'][i]['profile_path'] is not None:
            img_url = image_url_prefix + data['results'][i]['profile_path']
            response = requests.get(img_url)
            img = Image.open(BytesIO(response.content))
            face_landmarks_list = face_recognition.face_encodings(numpy.array(img))

        if not face_landmarks_list:
            params2 = dict(
                api_key=my_key
            )

            resp2 = requests.get(url=url_images + str(id) + "/images", params=params2)
            images_data = resp2.json()

            for counter in range(0, len(images_data['profiles'])):
                img_url = image_url_prefix + images_data['profiles'][counter]['file_path']
                response = requests.get(img_url)
                img = Image.open(BytesIO(response.content))
                face_landmarks_list = face_recognition.face_encodings(numpy.array(img))
                if face_landmarks_list:
                    break

        if face_landmarks_list:
            commitString = "INSERT INTO Celebrities (id,name"

            for j in range(0, 128):
                commitString += ',vec' + str(j)

            commitString += ") VALUES (" + str(id) + ",'" + name + "'"

            for j in range(0, 128):
                commitString += ',' + str(face_landmarks_list[0][j])

            commitString += ")"

            # print(str(pageNum) + " " + str(i) + " " + commitString)

            c.execute(commitString)
            conn.commit()

conn.close()

