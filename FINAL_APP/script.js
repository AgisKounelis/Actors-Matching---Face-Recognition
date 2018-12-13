$("document").ready(function() {

    var imgur_id = 'YOUR ID';
    var themoviedb_id = 'YOUR ID';
    var imgur_url = 'https://api.imgur.com/3/image/';
    var tmdb_movie_url = 'https://api.themoviedb.org/3/movie/'
    var tmdb_series_url = 'https://api.themoviedb.org/3/tv/'
    var tmdb_actor_url = 'https://api.themoviedb.org/3/person/';
    var tmdb_prefix = 'https://image.tmdb.org/t/p/w500';

    var images_counter = 0;
    var actors_list = [];
    var delete_hash;


    // INPUT
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

                    $('#imgur').val("");
                    find_actors_in_image(img_id);
                },
                error: function() {
                    $('#load_screen').hide();
                }
            });

        }

    });

    $("#submit_text").keyup(function(event) {
        if (event.key === 'Enter') {
            console.log('here');
            $("#submit_button").click();
        }
    });

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
                    let found = false;
                    for (let j = 0; j < actors_list.length; j++)
                        if (actors_list[j].id == res['results'][0]['id']) {
                            found = true;
                            break;
                        }

                    if (!found) {
                        let my_id = res['results'][0]['id'];
                        let my_name = res['results'][0]['name'];

                        actors_list.push({
                            "id": my_id
                        });

                        add_actor_img(my_id, my_name);
                        find_movies_and_series(my_id, true, true);
                        find_movies_and_series(my_id, false, true);
                    }
                }

                $('#submit_text').val("");

            },
            error: function() {
                $('#load_screen').hide();
            }
        });


    });


    // MAIN FUNCTIONS
    function find_actors_in_image(img_id) {

        $("#load_text").text("Searching for Actors...");

        $.ajax({
            url: "https://reputglory1.pythonanywhere.com/actor?id=" + img_id,
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
                    let found = false;
                    for (let j = 0; j < actors_list.length; j++)
                        if (actors_list[j].id == my_id) {
                            found = true;
                            break;
                        }

                    if (!found) {
                        actors_list.push({
                            "id": my_id
                        });
                        let my_name = response2[i]['name'];

                        add_actor_img(my_id, my_name);

                        let last = i == response2.length - 1;

                        find_movies_and_series(my_id, true, last);
                        find_movies_and_series(my_id, false, last);
                    } else
                        $('#load_screen').hide();

                }


            },
            error: function() {
                $('#load_screen').hide();
                console.log('ERROR WITH THE SERVER TRY AGAIN.');
            }

        });

    }

    function find_movies_and_series(my_id, movies, last) {
        let url;

        if (movies)
            url = tmdb_actor_url + my_id + '/movie_credits?api_key=' + themoviedb_id + '&language=en-US';
        else
            url = tmdb_actor_url + my_id + '/tv_credits?api_key=' + themoviedb_id + '&language=en-US';

        $.ajax({
            url: url,
            dataType: 'json',
            success: function(response) {
                let to_add_array = [];

                for (let i = 0; i < response['cast'].length; i++) {
                    let temp = [];
                    temp['id'] = response['cast'][i]['id'];
                    temp['path'] = response['cast'][i]['poster_path'];
                    if (movies)
                        temp['name'] = response['cast'][i]['original_title'];
                    else
                        temp['name'] = response['cast'][i]['name'];
                    to_add_array.push(temp);
                }


                let pos = 0;
                for (let j = 0; j < actors_list.length; j++)
                    if (actors_list[j].id == my_id) {
                        pos = j;
                        break;
                    }

                if (movies)
                    actors_list[pos]['movies'] = to_add_array;
                else
                    actors_list[pos]['series'] = to_add_array;


                if (last) {
                    render_movies_and_series(movies);
                    $('#load_screen').hide();
                }



            },
            error: function() {
                $('#load_screen').hide();
                console.log('NO MOVIES FOUND');
            }

        });

    }


    // SECONDARY FUNCTIONS
    function is_it_included(list, my_id) {
        for (let i = list.length - 1; i >= 0; i--)
            if (list[i]['id'] == my_id)
                return true;

        return false;
    }


    // RENDER FUNCTIONS
    function add_actor_img(my_id, my_name) {
        $.ajax({
            url: tmdb_actor_url + my_id + '/images?api_key=' + themoviedb_id,
            dataType: 'json',
            success: function(response3) {
                let new_img_url = 'no_photo.jpg';

                for (let i = 0; i < response3['profiles'].length; i++) {
                    let profile = response3['profiles'][i];
                    if (profile['file_path'] != null) {
                        new_img_url = tmdb_prefix + profile['file_path'];
                        break;
                    }
                }

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

    function render_movies_and_series(movies) {
        let text;

        if (movies)
            text = 'movies';
        else
            text = 'series'

        $('#' + text + '_grid').empty();

        let my_list;

        for (let i = 0; i < actors_list.length; i++) {

            if (i == 0)
                my_list = actors_list[0][text];
            else
                for (let c = my_list.length - 1; c >= 0; c--)
                    if (!is_it_included(actors_list[i][text], my_list[c]['id']))
                        my_list.splice(c, 1);
        }


        if (my_list != null) {

            for (let i = 0; i < 6; i++) {
                jQuery('<div/>', {
                    id: text + '_column' + i,
                    class: 'w3-quarter',
                }).appendTo('#' + text + '_grid');
            }

            let collumn_counter = 0;

            for (let i = 0; i < my_list.length; i++) {

                let my_id = my_list[i]['id'];
                let my_name = my_list[i]['name'];

                let my_url = 'no_photo.jpg';
                if (my_list[i]['path'] != null)
                    my_url = tmdb_prefix + my_list[i]['path'];

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


    // EXTRA FUNCTIONS
    $(document).on("click", ".movies, .series, .actor", function() {

        document.getElementById("img01").src = (this).src;
        document.getElementById("modal01").style.display = "block";
        var captionText = document.getElementById("caption");
        captionText.innerHTML = (this).alt;

        let url, prefix;

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

});