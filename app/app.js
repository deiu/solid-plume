/* ---- DON'T EDIT BELOW ---- */
var accURL = {};
var queryVals = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));


var defaults = {
        title: "/dev/solid",
        tagline: "Rocking the Solid Web",
        picture: "https://deiu.me/avatar.jpg",
        owner: "Andrei Sambra",
        avatar: "https://deiu.me/avatar.jpg"
};

var init = function() {
    document.querySelector('.blog-picture').src = defaults.picture;
    document.querySelector('.blog-title').innerHTML = defaults.title;
    document.querySelector('.blog-tagline').innerHTML = defaults.tagline;

    for (var i in posts) {
        addPost(posts[i]);
    }
};

var posts = {
    "https://example.org/post1": {
        url: "https://example.org/post1",
        title: "Introducing Solid",
        author: "https://deiu.me/profile#me",
        date: "4 Dec 2015",
        body: "Yesterday at CSSConf, we launched Pure – a new CSS library. Phew! Here are the slides from the presentation. Although it looks pretty minimalist, we’ve been working on Pure for several months. After many iterations, we have released Pure as a set of small, responsive, CSS modules that you can use in every web project.",
        tags: [
            { color: "#5aba59", name: "JS" },
            { color: "#4d85d1", name: "Solid" }
        ]
    },
    "https://example.org/post2": {
        url: "https://example.org/post2",
        title: "Everything You Need to Know About Solid",
        author: "https://deiu.me/profile#me",
        date: "3 Dec 2015",
        body: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        tags: [
            { color: "#df2d4f", name: "Linked Data" },
            { color: "#4d85d1", name: "Solid" }
        ]
    },
    "https://example.org/post3": {
        url: "https://example.org/post3",
        title: "Photos from CSSConf and JSConf",
        author: "https://deiu.me/profile#me",
        date: "1 Dec 2015",
        body: "",
        tags: [

        ]
    },
    "https://example.org/post4": {
        url: "https://example.org/post4",
        title: "Rdflib.js 0.9 Released",
        author: "https://user/profile#me",
        date: "24 Nov 2015",
        body: "We are happy to announce the release of Rdflib.js 0.9! You can find it now on github, download it directly, or pull it in via npm. We’ve also updated the Solid spec with the latest documentation.",
        tags: [
            { color: "#8156a7", name: "Other" }
        ]
    }
};

var authors = {
    "https://deiu.me/profile#me": {
        name: "Andrei Sambra",
        picture: "https://deiu.me/avatar.jpg"
    },
    "https://user/profile#me": {}
};


var addPost = function(post) {
    // Big change: <h1 class="content-subhead">Recent Posts</h1>
    var name = '';
    var picture = 'favicon.png';
    var author = authors[post.author];
    if (author && author.name) {
        name = author.name;
    }
    if (author && author.picture) {
        picture = author.picture;
    }


    // select element holding all the posts
    var postsdiv = document.querySelector('.posts');

    // create main post element
    var article = document.createElement('article');
    article.classList.add('post');
    article.id = post.url;

    // create header
    var header = document.createElement('header');
    header.classList.add('post-header');
    // append header to article
    article.appendChild(header);

    // set avatar
    var avatar = document.createElement('img');
    avatar.classList.add('post-avatar');
    avatar.src = picture;
    avatar.alt = name+"&#x27;s avatar";
    // append picture to header
    header.appendChild(avatar);


    // create title
    var title = document.createElement('h2');
    title.classList.add('post-title');
    title.innerHTML = (post.title)?post.title:'';
    // append title to header
    header.appendChild(title);

    // add meta data
    var meta = document.createElement('p');
    meta.classList.add('post-meta');
    meta.innerHTML = "By ";
    // append meta to header
    header.appendChild(meta);

    // meta author
    var metaAuthor = document.createElement('a');
    metaAuthor.classList.add('post-author');
    metaAuthor.href = post.author;
    metaAuthor.innerHTML = author.name;
    // append meta author to meta
    meta.appendChild(metaAuthor);

    // meta date
    var metaDate = document.createElement('span');
    metaDate.classList.add('post-date');
    metaDate.innerHTML = " on "+post.date;
    // append meta date to meta
    meta.appendChild(metaDate);

    // meta tags

    var metaTags = document.createElement('span');
    metaTags.classList.add('post-tags');
    metaTags.innerHTML = " under ";
    if (post.tags.length > 0) {
        for (var i in post.tags) {
            var tag = post.tags[i];
            if (tag.name && tag.name.length > 0) {
                var tagLink = document.createElement('a');
                tagLink.classList.add('post-category');
                if (tag.color) {
                    tagLink.setAttribute('style', 'background:'+tag.color+';');
                }
                tagLink.innerHTML = tag.name;
                tagLink.href = "#";
                tagLink.setAttribute('onclick', 'sortTag("'+tag.name+'")');
                metaTags.appendChild(tagLink);
            }
        }
    } else {
        var tagLink = document.createElement('a');
        tagLink.classList.add('post-category');
        tagLink.innerHTML = "Uncategorized";
        tagLink.href = "#";
        tagLink.setAttribute('onclick', 'sortTag("Uncategorized")');
        metaTags.appendChild(tagLink);
    }
    // append meta tag
    meta.appendChild(metaTags);

    // create body
    var body = document.createElement('section');
    body.classList.add('post-body');
    body.innerHTML = post.body;
    // append body to article
    article.appendChild(body);

    // append article to list of posts
    postsdiv.appendChild(article);

};

var sortTag = function(name) {
    console.log(name);
};

// start app
init();