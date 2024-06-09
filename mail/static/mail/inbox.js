document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // send mail
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');


});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';


}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = '';

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      //define component of a card
      const mailCard = document.createElement('div');
      const mailHeader = document.createElement('div');
      const mailBody = document.createElement('div');
      const mailTitle = document.createElement('h5');
      const  mailText = document.createElement('p');
      const mailFooter = document.createElement('div');
      const archivedButton = document.createElement('button');
      const replyButton = document.createElement('button');

      //set id for component
      mailCard.id = `email-${email.id}`;
      mailText.id = `text-${email.id}`;
      mailFooter.id = `footer-${email.id}`;
      archivedButton.id = `archive-${email.id}`;
      replyButton.id = `reply-${email.id}`;

      // set class
      mailCard.className = email.read ? "card bg-secondary border border-dark m-2" : "card border border-dark m-2";
      mailHeader.className = "card-header";
      mailBody.className = "card-body";
      mailTitle.className = "card-title";
      mailText.className = "card-text";
      mailFooter.className = "card-footer";
      archivedButton.className = "btn btn-primary ml-2 mt-3";
      replyButton.className = "btn btn-success mr-2 mt-3";

      // set inner HTML
      mailHeader.innerHTML = `FROM ${email.sender} TO ${email.recipients}`;
      mailTitle.innerHTML = `${email.subject}`;
      mailText.innerHTML = `${email.body}`;
      mailFooter.innerHTML = `${email.timestamp}`;
      replyButton.innerHTML = "Reply";

      // hide text of mail, archive and reply button
      mailText.style.display = 'none';
      archivedButton.style.display = 'none';
      replyButton.style.display = 'none'

      // append component to their container
      mailBody.append(mailTitle);
      mailBody.append(mailText);
      mailBody.append(mailFooter);
      mailBody.append(replyButton);
      mailBody.append(archivedButton);

      mailCard.append(mailHeader);
      mailCard.append(mailBody);

      // add event
      mailCard.addEventListener('click', () => load_mail(email));

      document.querySelector('#emails-view').append(mailCard);
    });
  });

}


function send_email(event) {
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    });
  load_mailbox('sent')
}


function load_mail(email){
  // hide all card except email
  document.querySelectorAll('.card').forEach(card => {
    if(card.id !== `email-${email.id}`){
      card.style.display = 'none';
    } else {
      card.classList.remove('bg-secondary');
    }
  });

  //define variable
  const mailText = document.querySelector(`#text-${email.id}`);
  const archiveButton = document.querySelector(`#archive-${email.id}`);
  const replyButton = document.querySelector(`#reply-${email.id}`);

  // set inner HTML
  archiveButton.innerHTML =  email.archived ? "Unarchive": "Archive";

  // display component
  mailText.style.display = 'block';
  archiveButton.style.display = 'inline';
  replyButton.style.display = 'inline';

  // update read mail
  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
  //update email archived or not
  archiveButton.removeEventListener('click', () => archiveHandler(email, archiveButton)); // Remove any existing event listener
  archiveButton.addEventListener('click', () => archiveHandler(email, archiveButton));

  // reply handler
  replyButton.removeEventListener('click', () => replyHandler(email, replyButton));
  replyButton.addEventListener('click', () => replyHandler(email, replyButton));
}


function archiveHandler(email, archiveButton) {
  archiveButton.disabled = true;

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  }).then(() => {
    archiveButton.innerHTML = email.archived ? "Unarchive" : "Archive";

    archiveButton.disabled = false;
    load_mailbox('inbox');
  });
}

function replyHandler(email, replyButton){
  replyButton.disabled = true;
  compose_email();

  const str = "Re: ";
  // fill recipients
  document.querySelector('#compose-recipients').value = `${email.sender}`;

  //fill subject
  const subject = document.querySelector('#compose-subject');
  if(email.subject.startsWith(str)){
    subject.value = email.subject;
  }
  else{
    subject.value = str + email.subject;
  }

  //fill body
  const body = document.querySelector('#compose-body');

  body.value = `On ${email.timestamp} ${email.sender} wrote:${email.body}`
  replyButton.disabled = false;
}
