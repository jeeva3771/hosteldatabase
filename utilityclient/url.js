function getAppUrl(url = '') {
    if (url) {
        url += url.endsWith("/") ? "" : "/"
        return `${process.env.APP_URL}${url}`
    }
    return process.env.APP_URL
}

module.exports = {
    getAppUrl
}