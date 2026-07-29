const all = await fetch('http://localhost:3000/api/rules').then(r => r.json())
console.log(all)