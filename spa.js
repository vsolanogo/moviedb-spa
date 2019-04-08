const API_BASE_URL = 'https://api.themoviedb.org/3';
const api_key = '05b8df1631c15f6dd003660574cc1e13';

const getPopularMovieAndTv = async () => {
    const resp = await fetch(`${API_BASE_URL}/trending/movie,tv/day?api_key=${api_key}&language=en-US&page=1`)
    const json = await resp.json();
    return json;
}

const getMovieTv = async ({ id, type }) => {
    if (!getMovieTv.answers) {
        getMovieTv.answers = {};
    }

    const key = JSON.stringify({ id, type })
    if (getMovieTv.answers[key] !== undefined) {
        return getMovieTv.answers[key];
    }

    const resp = await fetch(`${API_BASE_URL}/${type}/${id}?api_key=${api_key}&language=en-US`)
    const json = await resp.json();

    return getMovieTv.answers[key] = json;
}

const getMovieRecommendations = async ({ id, type }) => {
    if (!getMovieRecommendations.answers) {
        getMovieRecommendations.answers = {};
    }

    const key = JSON.stringify({ id, type })
    if (getMovieRecommendations.answers[key] !== undefined) {
        return getMovieRecommendations.answers[key];
    }

    const resp = await fetch(`${API_BASE_URL}/${type}/${id}/recommendations?api_key=${api_key}&language=en-US&page=1`)
    const json = await resp.json();

    return getMovieRecommendations.answers[key] = json;
}

const searchByTitle = async (title) => {
    if (!searchByTitle.answers) {
        searchByTitle.answers = {};
    }

    if (searchByTitle.answers[title] !== undefined) {
        return searchByTitle.answers[title];
    }

    const resp = await fetch(`${API_BASE_URL}/search/multi?api_key=${api_key}&language=en-US&query=${title}&page=1&include_adult=false`)
    const json = await resp.json();

    return searchByTitle.answers[title] = json;
}


const createHyperlink = ({ text, href, id, type }) => {
    const a = document.createElement('a')
    a.href = href;
    a.appendChild(document.createTextNode(text))
    a.onclick = (e) => {
        e.preventDefault()
        window.location.hash = `${type}=${id}`
    }
    return a;
}

const appendToBody = (node) => {
    const body = document.body;
    body.appendChild(node)
}

const createMovieList = (array, ulId) => {
    const list = array.map(x => {
        return {
            id: x.id,
            title: x.title || x.name,
            type: x.title ? 'movie' : 'tv'
        }
    })

    const ul = document.createElement('ul');

    ul.id = ulId;

    list.forEach(i => {
        const li = document.createElement('li')
        li.appendChild(createHyperlink({
            text: `${i.title}`,
            href: `movie${i.id}`,
            id: i.id,
            type: i.type,
        }))
        ul.appendChild(li)
    })

    return ul;
}

const MOVIE_FRAGMENT = 'movie_fragment'
const TRENDING_LIST = 'trending_list';
const FOUND_MOVIES_LIST = 'found_movies_list';
const SEARCH_FORM = 'search_form'

const clear = () => {
    removeById(FOUND_MOVIES_LIST);
    removeById(MOVIE_FRAGMENT);
    removeById(TRENDING_LIST);
}

const removeById = (id) => {
    try {
        const oldPage = document.querySelector(`#${id}`);
        oldPage.parentNode.removeChild(oldPage);
    } catch (e) {
        //console.log(e)
    }
}

const renderSearch = () => {
    const form = document.createElement('form');
    form.id = `${SEARCH_FORM}`

    form.innerHTML = `<input type='text' name='movie'>`
    form.innerHTML += `<input type='submit' value='Search'>`

    form.onsubmit = onSearchFormSubmit;

    appendToBody(form)

    return form;
}

const onSearchFormSubmit = (form) => {
    form.preventDefault();
    const thingsToSearch = form.target.movie.value;

    if (thingsToSearch === '') {
        window.location.hash = ''
        return;
    }

    window.location.hash = `search=${thingsToSearch}`
    form.target.movie.value = ''
}


const getMoviePage = ({ poster_path, title, name, overview, id }, type) => {
    const page = document.createElement('div');
    page.id = `${MOVIE_FRAGMENT}`

    page.innerHTML += `<img src='https://image.tmdb.org/t/p/w342${poster_path}'/>`
    page.innerHTML += `<h1>${title || name}</h1>`
    page.innerHTML += `<span>${overview} </span>`
    page.innerHTML += `<h2> Recommendations: </h2>`

    const recommendationList = document.createElement('span')
    recommendationList.innerHTML = 'Loading...'
    page.appendChild(recommendationList)

    getMovieRecommendations({ id, type })
        .then(x => {
            const list = x.results.slice(0, 3)

            if (list.length === 0) {
                recommendationList.innerHTML = 'Sorry, there are no recommendations';
            } else {
                const movList = createMovieList(list)
                recommendationList.parentNode.replaceChild(movList, recommendationList);
            }
        })
    return page;
}


const getFoundMovies = (title) => {
    const foundMovieList = document.createElement('div')
    foundMovieList.id = FOUND_MOVIES_LIST;
    const info = document.createElement('span')
    info.innerHTML = 'Loading...'
    foundMovieList.appendChild(info)

    searchByTitle(title)
        .then(resp => resp.results.filter(x => x.media_type === 'movie' || x.media_type === 'tv'))
        .then(arr => {
            if (arr.length === 0) {
                info.innerHTML = 'Sorry, nothing found';
            } else {
                info.remove();
                const movList = createMovieList(arr)
                foundMovieList.appendChild(movList);
            }
        })

    return foundMovieList;
}

const renderTrends = () => {
    getPopularMovieAndTv()
        .then(resp => createMovieList(resp.results, TRENDING_LIST))
        .then(resp => appendToBody(resp))
}

const hashchangeHandler = () => {
    clear();

    const hash = location.hash

    if (hash === '') {
        renderTrends();
        return;
    }

    const regex = /(tv|movie|search)=(\d+|\w+)$/
    const matched = hash.match(regex)
    const type = matched[1]
    const id = matched[2]

    if (type === 'tv' || type === 'movie') {
        getMovieTv({ type, id })
            .then(resp => {
                appendToBody(getMoviePage(resp, type))
                return;
            })
    }

    if (type === 'search') {
        appendToBody(getFoundMovies(id))
    }
}



const spa = () => {
    window.addEventListener('hashchange', hashchangeHandler);
    renderSearch()
    hashchangeHandler()
}

window.onload = () => {
    spa();
} 
