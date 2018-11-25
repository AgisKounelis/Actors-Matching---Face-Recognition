$("document").ready(function() {


    var imgur_id = 'YOUR IMGUR ID';
    var themoviedb_id = 'YOUR THEMOVIEDB ID';
    var imgur_url = 'https://api.imgur.com/3/image/';
    var tmdb_movie_url = 'https://api.themoviedb.org/3/movie/'
    var tmdb_series_url = 'https://api.themoviedb.org/3/tv/'
    var tmdb_actor_url = 'https://api.themoviedb.org/3/person/';
    var tmdb_prefix = 'https://image.tmdb.org/t/p/w500';

    var matching_movies = null;
    var matching_series = null;
    var images_counter = 0;
    var actors_list = [];
    var delete_hash;


    $(document).on("click", ".movies, .series, .actor", function() {

        document.getElementById("img01").src = (this).src;
        document.getElementById("modal01").style.display = "block";
        var captionText = document.getElementById("caption");
        captionText.innerHTML = (this).alt;

        let url, prefix;
        console.log($(this).attr("class"));
        if ($(this).attr("class") == 'actor') {
            url = tmdb_actor_url + (this).id + '/external_ids?api_key=' + themoviedb_id + '&language=en-US'
            prefix = "https://www.imdb.com/name/"
        } else if ($(this).attr("class") == 'movies') {
            url = tmdb_movie_url + (this).id + '/external_ids?api_key=' + themoviedb_id + '&language=en-US'
            prefix = "https://www.imdb.com/title/"
        } else { // series
            url = tmdb_series_url + (this).id + '/external_ids?api_key=' + themoviedb_id + '&language=en-US'
            prefix = "https://www.imdb.com/title/"
        }


        $.ajax({
            url: url,
            dataType: 'json',
            success: function(response) {
                captionText.href = prefix + response['imdb_id'] + '/';
            },
            error: function() {
                $('#load_screen').hide();
                console.log('ERROR FINDING SERIES LINK');
            }

        });
    });



    function delete_img(delete_hash) {

        var settings = {
            "crossDomain": true,
            "url": imgur_url + delete_hash,
            "method": "DELETE",
            "headers": {
                "Authorization": "Client-ID " + imgur_id
            }
        }

        $.ajax(settings).done(function(response) {
            console.log("DELETED");
        });

    }



    $('input[type=file]').on("change", function() {

        $('#load_screen').show();
        $("#load_text").text("Uploading Picture...");


        var $files = $(this).get(0).files;

        if ($files.length) {

            // Reject big files
            if ($files[0].size > $(this).data("max-size") * 1024) {
                alert("Please select a smaller file");
                return false;
            }

            // Begin file upload
            console.log("Uploading image..");


            var form = new FormData();
            form.append("image", $files[0]);


            $.ajax({
                url: imgur_url,
                data: form,
                mimeType: 'multipart/form-data',
                method: "POST",
                crossDomain: true,
                processData: false,
                contentType: false,
                headers: {
                    "Authorization": "Client-ID " + imgur_id
                },
                dataType: 'json',
                success: function(res) {
                    let img_id = res['data']['id'];
                    delete_hash = res['data']['deletehash'];

                    console.log('img link:' + res['data']['link']);

                    $('#imgur').val("");
                    find_actors_in_image(img_id);
                },
                error: function() {
                    $('#load_screen').hide();
                }
            });

        }


    });



    function find_actors_in_image(img_id) {

        $("#load_text").text("Searching for Actors...");


        $.ajax({
            url: "MY PYTHON SERVER URL" + img_id,
            crossDomain: true,
            method: "GET",
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response2) {
                delete_img(delete_hash);

                if (response2.length == 1)
                    $("#load_text").text("1 Actor found! Searching for Movies and Series...");
                else
                    $("#load_text").text(response2.length + " Actors found! Searching for Movies and Series...");

                if (response2.length === 0) {
                    $('#load_screen').hide();
                    console.log('NO ACTORS FOUND.');
                }


                for (let i = 0; i < response2.length; i++) { // foreach actor
                    let my_id = response2[i]['id'];
                    if (!actors_list.includes(my_id))
                        actors_list.push(my_id);
                    let my_name = response2[i]['name'];

                    add_actor_img(my_id, my_name);


                    find_movies_and_series(my_id, true);
                    find_movies_and_series(my_id, false);

                }

            },
            error: function() {
                $('#load_screen').hide();
                console.log('ERROR WITH THE SERVER TRY AGAIN.');
            }

        });

    }


    $("#submit_button").click(function() {

        $('#load_screen').show();
        $("#load_text").text("Searching for this name...");

        console.log("Searching for name..");

        $.ajax({
            url: 'https://api.themoviedb.org/3/search/person?api_key=' + themoviedb_id + '&language=en-US&query=' + $('#submit_text').val() + '&page=1&include_adult=false',
            dataType: 'json',
            success: function(res) {
                if (res['results'].length == 0) {
                    $('#load_screen').hide();
                    console.log('NO ACTORS FOUND.');
                } else {
                    let my_id = res['results'][0]['id'];
                    let my_name = res['results'][0]['name'];

                    $('#submit_text').val("");
                    add_actor_img(my_id, my_name);
                    find_movies_and_series(my_id, true);
                    find_movies_and_series(my_id, false);
                }

            },
            error: function() {
                $('#load_screen').hide();
            }
        });


    });


    function add_actor_img(my_id, my_name) {
        $.ajax({
            url: tmdb_actor_url + my_id + '/images?api_key=' + themoviedb_id,
            dataType: 'json',
            success: function(response3) {
                let new_img_url = tmdb_prefix + response3['profiles'][0]['file_path'];
                let img = $('<img class="actor">');
                img.attr('id', my_id);
                img.attr('src', new_img_url);
                img.attr('style', 'width:100%');
                img.attr('alt', my_name);
                img.appendTo('#actors_column' + images_counter);

                images_counter++;
                if (images_counter == 6) images_counter = 0;
            },
            error: function() {
                $('#load_screen').hide();
                console.log('ONLY TEXT');
            }
        });
    }


    function find_movies_and_series(my_id, movies) {
        let url;
        let my_list;

        if (movies) {
            my_list = matching_movies;
            url = tmdb_actor_url + my_id + '/movie_credits?api_key=' + themoviedb_id + '&language=en-US';
        } else {
            my_list = matching_series;
            url = tmdb_actor_url + my_id + '/tv_credits?api_key=' + themoviedb_id + '&language=en-US';
        }

        $.ajax({
            url: url,
            dataType: 'json',
            success: function(response) {
                let to_add_array = [
                    [],
                    [],
                    []
                ]; //0-ids, 1-urls, 2-names

                for (let i = 0; i < response['cast'].length; i++) {
                    to_add_array[0].push(response['cast'][i]['id']);
                    to_add_array[1].push(response['cast'][i]['poster_path']);
                    if (movies)
                        to_add_array[2].push(response['cast'][i]['original_title']);
                    else
                        to_add_array[2].push(response['cast'][i]['name']);
                }

                if (my_list == null)
                    if (movies)
                        matching_movies = to_add_array;
                    else
                        matching_series = to_add_array;

                else
                    for (let c = my_list[0].length; c >= 0; c--)
                        if (to_add_array[0].includes(my_list[0][c]) == false) {
                            my_list[0].splice(c, 1);
                            my_list[1].splice(c, 1);
                            my_list[2].splice(c, 1);
                        }

                render_movies_and_series(movies);
                $('#load_screen').hide();

            },
            error: function() {
                $('#load_screen').hide();
                console.log('NO MOVIES FOUND');
            }

        });

    }


    function render_movies_and_series(movies) {
        let text;
        let my_list;

        if (movies) {
            text = 'movies';
            my_list = matching_movies;
        } else {
            text = 'series'
            my_list = matching_series;
        }

        $('#' + text + '_grid').empty();

        if (my_list != null) {

            for (let i = 0; i < 6; i++) {
                jQuery('<div/>', {
                    id: text + '_column' + i,
                    class: 'w3-quarter',
                }).appendTo('#' + text + '_grid');
            }

            let collumn_counter = 0;

            for (let i = 0; i < my_list[0].length; i++) {

                let my_id = my_list[0][i];
                let my_name = my_list[2][i];

                if (my_list[1][i] != null) {
                    let my_url = tmdb_prefix + my_list[1][i];
                    let img = $('<img class="' + text + '">');
                    img.attr('id', my_id);
                    img.attr('src', my_url);
                    img.attr('style', 'width:100%;');
                    img.attr('alt', my_name);
                    img.appendTo('#' + text + '_column' + collumn_counter % 6);
                    collumn_counter++;
                }

            }

        }

    }


});