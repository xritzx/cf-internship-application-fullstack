addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
    /* 
   For even request distribution KV could be used for a near perfect
   balanced redirects to either of the URL. By keeping a count of each 
   redirects in a KV pair and updating it on each redirect 
   ie. add one for 1st URl, subtract one for 2nd URL redirect.
   Thus maintaining a balance between two keeping the count close to zero.
   But for Free-tier we have to rely on random function
  */

  const url = 'https://cfw-takehome.developers.workers.dev/api/variants'
  // To Store the response array of base url
  let url_response
  await fetch(url)
    .then(response =>  response.json())
    .then(data => url_response = data)
  console.log(url_response);

  // Check if client has been already assigned a url 
  let url_index = getCookie(request, 'index')
  console.log(url_index);
  
  if(url_index != -1){
    console.log(`Cookie Found ${url_index}`)
  }
  else{
    url_index = getRandomWeightedURL()
    console.log(`Failed getting cookie ${url_index}`)
  }

  const sub_url = url_response.variants[url_index];
  
  let response;
  await fetch(sub_url)
    .then(res => res.text())
    .then(data => response = data)
  
  let response_obj = new Response(response, 
    {
       'status':200,
       'headers':{
        'Content-Type': 'text/html',
       }
    })
  
  response_obj.headers.append('Set-Cookie', putCookie('index', url_index))
  return new HTMLRewriter().on('*', new ElementHandler(url_index)).transform(response_obj)
}


// To generate the corresponding Cookie
function putCookie(key, value, expire){
  expire = expire || 10 // expire in 10 days if not set
  const date = new Date()
  date.setTime(date.getTime()+(expire*24*60*60*1000))
  return `${key}=${value};Expires=${date.toGMTString()};Domain=.cf-internship.workers.dev;HttpOnly`
}


// To retrieve the cookies for persistance of url_index
function getCookie(req, key){
  let Cookies = req.headers.get('Cookie')

  console.log('I have some Cookies wanna have? ')
  console.log(Cookies);
  
  let cookies = Cookies.split(';')
  let value;
  
  for(let cookie of cookies){
    let trimmed = cookie.trim()    
    if(trimmed.indexOf(key)!=-1){
      value = trimmed.split('=')[1]
      break
    }
  }

  return parseInt(value)||-1;
}

// Generates a Random number with a adjustable bias
function getRandomWeightedURL(weight){
  weight = weight || 0.5
  const num =  Math.random();
  console.log(num);
  
  return num<weight?1:0;
}

// My verbose data nvm
const my_data = (n) =>{
  return{
    title: `Welcome to the ${n+1} Variant`,
    page_title: `Mirror Variant ${n+1}`,
    description: `Hi! I am Ritankar Paul an electronics engineer and a passionate web developer 
                  I really loved using Cloudflare Workers it's just awesome, it's simple and
                  seamless to setup thanks to signalnerve for his tutorials, serverless yet not that static and has some support for dynamic content`,
    url_text: `Visit my Portfolio from ${n+1} variant`,
    resume_url: 'https://xritzx.in'
  }
}

// HTMLRewritter class for modifying html content
class ElementHandler {
  constructor(n) {
    this.data = my_data(n)
  }

  element(element) {
    const name = element.tagName;
    switch (name) {
      case 'body':
        element.setAttribute('style',`background: #085078;
              background: -webkit-linear-gradient(to right, #85D8CE, #085078);
              background: linear-gradient(to right, #85D8CE, #085078);`)
        break
      case 'title':
        element.setInnerContent(this.data.page_title)
        break
      case 'h1':
        element.setInnerContent(this.data.title)
        break
      case 'p':
        element.setInnerContent(this.data.description)
        break
      case 'a':
        element.setInnerContent(this.data.url_text)
        element.setAttribute('href', this.data.resume_url)
      default:
        break;
    }
    
  }
}
