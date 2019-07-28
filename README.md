# [Streamix Bot](https://t.me/streamix_bot)

It's Telegram bot which help you get information from various type of sources like RSS and group them into private or public channels.

### How it works

This bot uses your bots tokens to overcome telegram limits and send messages to your channels. To start using it you need to create your bot from @BotFather and forward message with bot token to this bot. When your bots are added you can add channels. It can be public or private, there is only one important thing - one of bot that you added must be an administrator in these channels, bot connect them automatically. After those steps you can add sources for channels, each channel can have unlimited sources. Every N minutes this bot check sources and send new data by your bot which connected to channels.

### Technical details

- Typescript
- Telegraf
- TypeORM
- PostgreSQL

## Usage overview

At first, you need to copy .env.example file to .env and fill it. After first run, it creates tables automatically.

In development mode bot send new data only to ADMIN_ID and also database scheme tries to migrate automatically.

Build

```
npm run build
```

Start

```
npm run start
```

Lint

```
npm run lint
```

### License

(The MIT License)

Copyright (c) 2019 Boris Ryabov <contact@bsryabov.ru>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Resources

- Visit the [author website](http://www.bsryabov.ru).
- Report issues on the [github issues](https://github.com/rvboris/streamix-bot/issues) page.
