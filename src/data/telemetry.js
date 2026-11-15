// Owner 15 Nov: anonymous play statistics and the "Report a problem" button. Both work only in the GitHub Pages
// build (hosts) and only when their key is set; nothing is sent from the claude.ai copy or a local dev server.
// Statistics: GoatCounter (no cookies, no stored IP); unique players are its visitor count of the page view.
// Report: Web3Forms mails the message to the owner. Its access key is public by design (it can only send mail to him).
export const TELEMETRY=Object.freeze({
  hosts:Object.freeze(['tom161819.github.io']),
  goatcounter:'hra1616',
  dayMilestones:Object.freeze([2,5,10,25,50,100,150,200,300]),
  minuteMilestones:Object.freeze([5,15,30,60,120,240]),
  storageKey:'mk.telemetry',
  report:Object.freeze({endpoint:'https://api.web3forms.com/submit',accessKey:'4dd1b666-6b3e-4a93-9a76-3673ef0dc9c7',maxLength:2000,perHour:5,storageKey:'mk.reports',kinds:Object.freeze(['bug','idea','other'])})
});
export const telemetryHost=(hostname,hosts=TELEMETRY.hosts)=>hosts.includes(String(hostname??'').toLowerCase());
