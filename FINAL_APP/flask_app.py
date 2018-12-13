from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import sqlite3
import face_recognition
import requests
import numpy

app = Flask(__name__)
CORS(app) # make it accessible for requests


@app.route('/actor', methods=['GET', 'POST'])
def get_new_actor():

    img_id = request.args.get('id')

    url = 'https://api.imgur.com/3/image/' + img_id
    headers = {'Authorization': 'Client-ID YOUR ID'}
    response = requests.request('GET', url, headers=headers)
    data = response.json()
    img_url = data['data']['link']
    response = requests.get(img_url)
    img = face_recognition.load_image_file(BytesIO(response.content))
    faces_list = face_recognition.face_encodings(numpy.array(img))

    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    commitString = 'SELECT * FROM Celebrities'

    c.execute(commitString)
    resultString = c.fetchall()

    min_num = 0.6
    min_name = ' '
    min_id = 0

    list_of_found = []

    for face in faces_list:
        for row in resultString:
            id = row[0]
            name = row[1]
            array = []
            for i in range(0, 128):
                array.append(row[2 + i])

            result = face_recognition.face_distance([face],
                    numpy.array(array))

            if result < min_num:
                min_num = result
                min_name = name
                min_id = id

        if min_num < 0.6:
            list_of_found.append({'id': min_id, 'name': min_name})
            min_num = 0.6

    conn.close()

    return jsonify(list_of_found)
