const allowed=['/request','/donate','/history','/dashboard','/dashboard?view=donor','/coordination','/coordination?view=donor'];
export function rememberDestination(path){if(allowed.includes(path))sessionStorage.setItem('lifelink-next',path);}
export function authDestination(){const path=sessionStorage.getItem('lifelink-next');sessionStorage.removeItem('lifelink-next');return allowed.includes(path)?path:'/history';}
