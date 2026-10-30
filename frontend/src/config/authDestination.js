export function rememberDestination(destination){
 if(['/dashboard','/dashboard?view=donor'].includes(destination))sessionStorage.setItem('lifelink-next',destination);
}
export function authDestination(){
 const destination=sessionStorage.getItem('lifelink-next');sessionStorage.removeItem('lifelink-next');
 return ['/dashboard','/dashboard?view=donor'].includes(destination)?destination:'/dashboard';
}
