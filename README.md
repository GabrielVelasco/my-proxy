# my-proxy
An API to intermediate requests to SofaScore API (By-pass Cors policy).

## Motivation
Couldn't do a direct request to SofaScore API due to CORS policy, so I made this "proxy"...
Web app requests the proxy -> proxy request the original source API (by-pass Cors) -> source API returns data ...

## Update
Not in use anymore, did it just for """fun""".
I later used it for other purpose (as a proxy to my "Eleicoes 2022" project)

## Frameworks/Programs/APIs used
| Name                                             | Usage                                                        |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [Heroku](https://www.heroku.com/) | To host API |
