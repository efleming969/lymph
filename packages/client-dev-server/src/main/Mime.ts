export default class Mime {
    static byExtension( extension ) {
        const mimeTypes = {
            ".js": "application/javascript",
            ".mjs": "application/javascript",
            ".json": "application/json",
            ".jpg": "image/jpeg",
            ".png": "image/png",
            ".ico": "image/x-icon",
            ".svg": "image/svg+xml",
            ".css": "text/css",
            ".html": "text/html"
        }
        return mimeTypes[ extension ] || "application/octet-stream"
    }
}