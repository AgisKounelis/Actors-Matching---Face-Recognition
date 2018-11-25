# Actors Matching!
Online Preview: https://kounelisagis.com/actors_matching/

## Example
![Example](https://raw.githubusercontent.com/AgisKounelis/Actors-Matching---Face-Recognition/master/_images/example.png)

## Inspiration
A big number of people spend plenty of time watching Movies and Series. You can easily find and watch movies of your favorite actor. What if you could find movies with more than one actor of your choice?

## What it does
**Actors Matching** is a web application which finds all the common **Movies and Series** based on the input actors.

## Built With
- HTML, CSS, JQuery
- dlib face recognision library
- SQLite
- themoviedb API
- imgur API
  
## Preparatory Work
For the identification of the the input face a database is obviously needed. I used dlib library so my SQLite database looks like this:

id|name|vec0|. . .|vec127
|-|-|-|-|-
|. . .|. . .|. . .|. . .|. . .
|1461|George Clooney|-0.141083955764771|. . .|0.0466132797300816
|72129|Jennifer Lawrence|-0.0845887884497643|. . .|0.100062392652035
|2037|Cillian Murphy|0.0598341822624207|. . .|-0.0251330602914095
|. . .|. . .|. . .|. . .|. . .
>**Explanation**\
> id: themoviedb id of the actor\
> name: the name of the actor\
> vec0 - vec127: a set of 128 face points

## Actors Input
Actors can be inserted with two ways.
*Method #1 - Image:* It can contain one or more actors. Their faces are recognised using **dlib library** running on a python server.
*Method #2 - Text:* It can contain only the name of one actor.

## Text-Based Name Search
Name search just makes a simple request to themoviedb and return the first result

## Image-Based Face Recognition Search
- upload image(jpg and png tested and working) using JQuery and get the Imgur photo_id	(imgur API)
- pass the photo_id to the python and return actor(s)	(python server, SQLite)

## Post-Search Procedure
- add each new actor to actors' list and find their movies and series (themoviedb API)
- update the UI with pictures, names and links
- delete image if the Image-Based Search was used

## Future Updates - Current Problems
- Currently there is a problem when a photo contains more than one actors. They are successfully recognised but the output movies are only one's.
- Image Uploading might take big amount of time when the internet connection is slow. Maybe resizing the image before the upload would help.
- App renders images of varying size and that can be visually bad in some cases. Fixed size images would be better.
