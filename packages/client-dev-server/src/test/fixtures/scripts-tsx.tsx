const h = ( tag, props, text ) => text

const message = () => <h1>hello, tsx</h1>

document.body.append( document.createTextNode( message() ) )
