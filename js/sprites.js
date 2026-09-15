// Super Mario Web - Procedural Retro Pixel Art Sprite Generator
// 100% Canvas-rendered NES-authentic 16x16 / 16x32 pixel sprites

class SpriteRenderer {
    constructor() {
        this.cache = {};
        this.T = 16; // Base tile unit size
        this.initAllSprites();
    }

    // Helper: Create an offscreen canvas of given size
    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { c, ctx };
    }

    // Helper to render pixel matrix from text grid
    renderGrid(w, h, grid, palette) {
        const { c, ctx } = this.createCanvas(w, h);
        for (let y = 0; y < h; y++) {
            const row = grid[y];
            if (!row) continue;
            for (let x = 0; x < w; x++) {
                const char = row[x];
                if (char && palette[char]) {
                    ctx.fillStyle = palette[char];
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        return c;
    }

    initAllSprites() {
        this.initTiles();
        this.initItems();
        this.initEnemies();
        this.initMario();
        this.initCastle();
    }

    initTiles() {
        // Overworld Ground
        const groundPalette = {
            'b': '#b84418', // Brown dark
            'l': '#e45c10', // Brown light
            'k': '#000000', // Black
            'h': '#fce4a0'  // Highlight
        };
        const groundGrid = [
            "hhhhllllllllllkk",
            "hbbbbbbbbbbbbkll",
            "hbbbbbbbbbbbbkll",
            "hbbkkbbbbkkbbkll",
            "hbbkkbbbbkkbbkll",
            "hbbbbbbbbbbbbkll",
            "hbbbbbbbbbbbbkll",
            "hkkbbbbkkbbbbkll",
            "hkkbbbbkkbbbbkll",
            "hbbbbbbbbbbbbkll",
            "hbbbbbbbbbbbbkll",
            "hbbkkbbbbkkbbkll",
            "hbbkkbbbbkkbbkll",
            "hbbbbbbbbbbbbkll",
            "hkkkkkkkkkkkkkll",
            "llllllllllllllll"
        ];
        this.cache['ground_overworld'] = this.renderGrid(16, 16, groundGrid, groundPalette);

        // Underground Ground / Brick (Blue theme)
        const ugPalette = {
            'b': '#008088',
            'l': '#00e8d8',
            'k': '#000000',
            'h': '#ffffff'
        };
        this.cache['ground_underground'] = this.renderGrid(16, 16, groundGrid, ugPalette);

        // Castle Stone Ground (Dark Gray / Red tone)
        const castlePalette = {
            'b': '#686868',
            'l': '#a4a4a4',
            'k': '#000000',
            'h': '#d8d8d8'
        };
        this.cache['ground_castle'] = this.renderGrid(16, 16, groundGrid, castlePalette);

        // Brick Block
        const brickGrid = [
            "kkkkkkkkkkkkkkkk",
            "llhbbbbkllhbbbbk",
            "llhbbbbkllhbbbbk",
            "kkkkkkkkkkkkkkkk",
            "bbkllhbbbbkllhbb",
            "bbkllhbbbbkllhbb",
            "kkkkkkkkkkkkkkkk",
            "llhbbbbkllhbbbbk",
            "llhbbbbkllhbbbbk",
            "kkkkkkkkkkkkkkkk",
            "bbkllhbbbbkllhbb",
            "bbkllhbbbbkllhbb",
            "kkkkkkkkkkkkkkkk",
            "llhbbbbkllhbbbbk",
            "llhbbbbkllhbbbbk",
            "kkkkkkkkkkkkkkkk"
        ];
        this.cache['brick_overworld'] = this.renderGrid(16, 16, brickGrid, groundPalette);
        this.cache['brick_underground'] = this.renderGrid(16, 16, brickGrid, ugPalette);
        this.cache['brick_castle'] = this.renderGrid(16, 16, brickGrid, castlePalette);

        // Question / Mystery Block - 3 Animation frames
        const qPalette1 = { 'o': '#fc9838', 'd': '#b84418', 'w': '#fce4a0', 'k': '#000000' };
        const qPalette2 = { 'o': '#fcd884', 'd': '#e47c0c', 'w': '#ffffff', 'k': '#000000' };
        const qGrid = [
            "kkkkkkkkkkkkkkkk",
            "kwwwwwwwwwwwwwwd",
            "kwoooooooooooodd",
            "kwooookkkkoooodd",
            "kwoookkwwkkooodd",
            "kwoookkoookkoodd",
            "kwooookoookkoodd",
            "kwoooooookkkoodd",
            "kwoooooookkooddd",
            "kwoooooookkooddd",
            "kwoooooooookoodd",
            "kwoooooookkooddd",
            "kwoooooookkooddd",
            "kwoooooooooodddd",
            "kddddddddddddddd",
            "dddddddddddddddd"
        ];
        this.cache['qblock_0'] = this.renderGrid(16, 16, qGrid, qPalette1);
        this.cache['qblock_1'] = this.renderGrid(16, 16, qGrid, qPalette2);

        // Empty Hit Block
        const emptyGrid = [
            "kkkkkkkkkkkkkkkk",
            "kddddddddddddddk",
            "kd............dk",
            "kd.kk......kk.dk",
            "kd.kk......kk.dk",
            "kd............dk",
            "kd............dk",
            "kd............dk",
            "kd............dk",
            "kd............dk",
            "kd............dk",
            "kd.kk......kk.dk",
            "kd.kk......kk.dk",
            "kd............dk",
            "kddddddddddddddk",
            "kkkkkkkkkkkkkkkk"
        ];
        const emptyPalette = { 'k': '#000000', 'd': '#884400', '.': '#b85c18' };
        this.cache['qblock_empty'] = this.renderGrid(16, 16, emptyGrid, emptyPalette);

        // Pipe Top (32x16)
        const pipeTopPalette = {
            'k': '#000000',
            'd': '#005000',
            'm': '#00a800',
            'l': '#80d010',
            'w': '#b8f818'
        };
        const pipeTopGrid = [
            "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
            "kwwwwllmmmmmmmmmmmmmmmmmmddddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kwllmmmmmmmmmmmmmmmmmmmmmmdddddk",
            "kddddddddddddddddddddddddddddddk",
            "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"
        ];
        this.cache['pipe_top'] = this.renderGrid(32, 16, pipeTopGrid, pipeTopPalette);

        // Pipe Body (32x16)
        const pipeBodyGrid = [
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   ",
            "  kwwllmmmmmmmmmmmmmmmmmmdddk   "
        ];
        this.cache['pipe_body'] = this.renderGrid(32, 16, pipeBodyGrid, pipeTopPalette);

        // Brick Debris (8x8)
        const debrisGrid = [
            "kkkkkk  ",
            "kbbbblk ",
            "kbbbbllk",
            "kbbblllk",
            "kbbllkkk",
            "kbllk   ",
            "kllk    ",
            "kkk     "
        ];
        this.cache['brick_debris'] = this.renderGrid(8, 8, debrisGrid, groundPalette);
    }

    initItems() {
        // Coin - 4 frames
        const coinPalette = {
            'k': '#000000',
            'o': '#fc9838',
            'y': '#fcd828',
            'w': '#ffffff'
        };
        const coinF0 = [
            "    kkkkkk    ",
            "  kkyyyyyykk  ",
            " kkyyywwyyyyk ",
            "kkyyywwwyyyykk",
            "kkyyykkkkyyykk",
            "kkyyykkkkyyykk",
            "kkyyykkkkyyykk",
            "kkyyykkkkyyykk",
            "kkyyykkkkyyykk",
            "kkyyykkkkyyykk",
            "kkyyywwwyyyykk",
            " kkyyywwyyyyk ",
            "  kkyyyyyykk  ",
            "    kkkkkk    "
        ];
        const coinF1 = [
            "     kkkk     ",
            "   kkyyyykk   ",
            "  kkyywwyyk   ",
            "  kkyywwyykk  ",
            "  kkyykkkkyk  ",
            "  kkyykkkkyk  ",
            "  kkyykkkkyk  ",
            "  kkyykkkkyk  ",
            "  kkyykkkkyk  ",
            "  kkyykkkkyk  ",
            "  kkyywwyykk  ",
            "  kkyywwyyk   ",
            "   kkyyyykk   ",
            "     kkkk     "
        ];
        const coinF2 = [
            "      kk      ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "    kkyykk    ",
            "      kk      "
        ];
        this.cache['coin_0'] = this.renderGrid(14, 14, coinF0, coinPalette);
        this.cache['coin_1'] = this.renderGrid(14, 14, coinF1, coinPalette);
        this.cache['coin_2'] = this.renderGrid(14, 14, coinF2, coinPalette);

        // Super Mushroom (16x16)
        const mushPalette = {
            'k': '#000000',
            'r': '#d82800',
            'w': '#fcfcfc',
            's': '#fc9838'
        };
        const mushGrid = [
            "     kkkkkk     ",
            "   kkrrrrrrkk   ",
            "  krrrrwwwwrrk  ",
            " krrrrwwwwwwrrk ",
            "krrwwwrrwwrrwwwk",
            "krrwwwrrwwrrwwwk",
            "krrwwwrrwwrrwwwk",
            "krrwwwrrwwrrwwwk",
            "krrrrwwwwwwrrrrk",
            "krrrrwwwwwwrrrrk",
            " kkksssssssskkk ",
            "  kssskksskkssk ",
            "  kssskksskkssk ",
            "  ksssssssssssk ",
            "  ksssssssssssk ",
            "   kkkkkkkkkkk  "
        ];
        this.cache['mushroom_super'] = this.renderGrid(16, 16, mushGrid, mushPalette);

        // 1-Up Mushroom (Green)
        const oneUpPalette = {
            'k': '#000000',
            'r': '#00a800',
            'w': '#fcfcfc',
            's': '#fc9838'
        };
        this.cache['mushroom_1up'] = this.renderGrid(16, 16, mushGrid, oneUpPalette);

        // Fire Flower (16x16)
        const flowerPalette1 = {
            'k': '#000000',
            'r': '#d82800',
            'o': '#fc9838',
            'w': '#fcfcfc',
            'g': '#00a800'
        };
        const flowerGrid = [
            "     kkkkkk     ",
            "   kkrrrrrrkk   ",
            "  krrrowwrorrk  ",
            " krrrowkkwkorrk ",
            "krrrowwkwkowwrrk",
            "krrrowwkwkowwrrk",
            " krrrowkkwkorrk ",
            "  krrrowwrorrk  ",
            "   kkrrrrrrkk   ",
            "     kkggkk     ",
            "   kkkggggkkk   ",
            "  kgggkkggkkggk ",
            "  kgggkkggkkggk ",
            "   kkggggggggk  ",
            "     kkggggkk   ",
            "       kkkk     "
        ];
        this.cache['flower_0'] = this.renderGrid(16, 16, flowerGrid, flowerPalette1);

        // Starman (16x16)
        const starPalette = {
            'k': '#000000',
            'y': '#fcd828',
            'w': '#ffffff',
            'o': '#fc9838'
        };
        const starGrid = [
            "       kk       ",
            "      kyyk      ",
            "     kkyykk     ",
            "     kyyyyk     ",
            "kkkkkkyyyyykkkkk",
            "kyyyyyyyyyyyyyyk",
            " kkyykyyyykyykk ",
            "  kkykyyyykykk  ",
            "   kyyyyyyyyk   ",
            "   kyyyyyyyyk   ",
            "  kyyykkkkyyyk  ",
            " kyykky  ykkyyk ",
            "kyyk      kkyyk ",
            "kyk        kykk ",
            "kk          kkk ",
            "                "
        ];
        this.cache['star'] = this.renderGrid(16, 16, starGrid, starPalette);

        // Fireball (8x8)
        const fireballPalette = {
            'k': '#000000',
            'r': '#d82800',
            'o': '#fc9838',
            'y': '#fcd828'
        };
        const fireballGrid = [
            "  kkkk  ",
            " krrooyk",
            "krrroyyk",
            "kroyyyyk",
            "kroyyyyk",
            "krooyyyk",
            " krroykk",
            "  kkkk  "
        ];
        this.cache['fireball'] = this.renderGrid(8, 8, fireballGrid, fireballPalette);
    }

    initEnemies() {
        // Goomba
        const goombaPalette = {
            'k': '#000000',
            'b': '#b84418',
            's': '#fc9838',
            'w': '#ffffff'
        };
        const goombaF1 = [
            "     kkkkkk     ",
            "   kkbbbbbbkk   ",
            "  kbbbbbbbbbbk  ",
            " kbbbbbbbbbbbbk ",
            "kbbkkwbbbbwkkwbk",
            "kbbkkwbbbbwkkwbk",
            "kbbkkwbbbbwkkwbk",
            "kbbbbbbkkbbbbbbk",
            " kbbbbssssbbbbk ",
            "  kksssssssskk  ",
            "   kssssssssk   ",
            "  kksssssssskk  ",
            " kkkkssssssssk  ",
            "kbbbksssssssskk ",
            "kbbbk  kkkkkbbbk",
            " kkk        kkk "
        ];
        const goombaF2 = [
            "     kkkkkk     ",
            "   kkbbbbbbkk   ",
            "  kbbbbbbbbbbk  ",
            " kbbbbbbbbbbbbk ",
            "kbbkkwbbbbwkkwbk",
            "kbbkkwbbbbwkkwbk",
            "kbbkkwbbbbwkkwbk",
            "kbbbbbbkkbbbbbbk",
            " kbbbbssssbbbbk ",
            "  kksssssssskk  ",
            "   kssssssssk   ",
            "  kksssssssskk  ",
            "  ksssssssskkkk ",
            " kksssssssskbbbk",
            "kbbbkkkkk  kbbbk",
            " kkk        kkk "
        ];
        const goombaFlat = [
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "     kkkkkk     ",
            "   kkbbbbbbkk   ",
            "  kbbkkwbbwkbbk ",
            " kbbbbkkbbkkbbbk",
            "kssssssssssssssk",
            "kssssssssssssssk",
            "kkkbbbbbbbbbbkkk",
            "  kkkkkkkkkkkk  "
        ];
        this.cache['goomba_0'] = this.renderGrid(16, 16, goombaF1, goombaPalette);
        this.cache['goomba_1'] = this.renderGrid(16, 16, goombaF2, goombaPalette);
        this.cache['goomba_flat'] = this.renderGrid(16, 16, goombaFlat, goombaPalette);

        // Koopa Troopa (16x24)
        const koopaPalette = {
            'k': '#000000',
            'g': '#00a800',
            'y': '#fcd828',
            'w': '#ffffff',
            'r': '#d82800'
        };
        const koopaF1 = [
            "      kkkkk     ",
            "    kkyyyywwk   ",
            "   kyyyyyywwkk  ",
            "   kyyyykkkwwk  ",
            "   kyyyyykkwwk  ",
            "   kyyyyyyyyyk  ",
            "    kkyyyyykk   ",
            "   kkkkggggk    ",
            "  kggggkgggk    ",
            " kgggggwkggk    ",
            "kgggggwwwwk     ",
            "kggggkwwwwk     ",
            "kggggwwwwk      ",
            "kggggwwwk       ",
            "kgggggggk       ",
            " kgggggk        ",
            "  kkkkk         ",
            "   kyyk         ",
            "  kyyyk         ",
            " kkyyyk         ",
            "kyyyyyk         ",
            "kyyyyyk         ",
            " kkkkk          ",
            "                "
        ];
        const koopaF2 = [
            "      kkkkk     ",
            "    kkyyyywwk   ",
            "   kyyyyyywwkk  ",
            "   kyyyykkkwwk  ",
            "   kyyyyykkwwk  ",
            "   kyyyyyyyyyk  ",
            "    kkyyyyykk   ",
            "   kkkkggggk    ",
            "  kggggkgggk    ",
            " kgggggwkggk    ",
            "kgggggwwwwk     ",
            "kggggkwwwwk     ",
            "kggggwwwwk      ",
            "kggggwwwk       ",
            "kgggggggk       ",
            " kgggggk        ",
            "  kkkkk         ",
            "   kyyykk       ",
            "   kyyyykk      ",
            "    kkyyyk      ",
            "     kyyyk      ",
            "    kyyyyk      ",
            "     kkkk       ",
            "                "
        ];
        const koopaShell = [
            "     kkkkkk     ",
            "   kkggggggkk   ",
            "  kggggkgggk   ",
            " kgggggwkggkk  ",
            "kgggggwwwwkggk ",
            "kggggkwwwwkggk ",
            "kggggwwwwkkggk ",
            "kggggwwwkgggk  ",
            "kggggggggggk   ",
            " kggggggggk    ",
            "  kggggggk     ",
            "  kyyyyyyk     ",
            " kyyyyyyyyk    ",
            "kyyyyyyyyyyk   ",
            "kkkkkkkkkkkk   ",
            "                "
        ];
        this.cache['koopa_0'] = this.renderGrid(16, 24, koopaF1, koopaPalette);
        this.cache['koopa_1'] = this.renderGrid(16, 24, koopaF2, koopaPalette);
        this.cache['koopa_shell'] = this.renderGrid(16, 16, koopaShell, koopaPalette);

        // Piranha Plant (16x24)
        const piranhaPalette = {
            'k': '#000000',
            'r': '#d82800',
            'w': '#ffffff',
            'g': '#00a800'
        };
        const piranhaGrid = [
            "    kkkkkkkk    ",
            "   krrrwrrrwwk  ",
            "  krrkwwrwwrwwk ",
            " krrkwwwwwwwwk  ",
            " krrkkkkkkkkk   ",
            " krrkwwwwwwwwk  ",
            "  krrkwwrwwrwwk ",
            "   krrrwrrrwwk  ",
            "    kkkkkkkk    ",
            "       kk       ",
            "      kggk      ",
            "     kggggk     ",
            "     kggggk     ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      ",
            "      kggk      "
        ];
        this.cache['piranha_0'] = this.renderGrid(16, 24, piranhaGrid, piranhaPalette);

        // Bowser (32x32)
        const bowserPalette = {
            'k': '#000000',
            'g': '#00a800',
            'y': '#fcd828',
            'r': '#d82800',
            'w': '#ffffff',
            'o': '#fc9838'
        };
        const bowserGrid = [
            "             kkkkkk             ",
            "           kkrrrrrrkk           ",
            "         kkrrrrrrrrrrkk         ",
            "        kyykkrrrrrrkkyyk        ",
            "       kyywkkyyyyyykkwyyk       ",
            "      kyywwkkyyyyyykkwyyk       ",
            "      kyywwkyyyyyyyykwyyk       ",
            "     kkyywwkyykkkkyykwyykk      ",
            "    kggggkkkyykkkkyyykkggggk    ",
            "   kggggggkkkkkkkkkkkggggggk   ",
            "  kggggwkggggggggggggkwkggggk   ",
            "  kgggwkggggggggggggggkwkgggk   ",
            " kggggwkgggggkkkkgggggkwkggggk  ",
            " kggggwkggggkyyyykggggkwkggggk  ",
            " kggggwkgggkyyyyyykgggkwkggggk  ",
            " kggggwkggkyyyyyyyykggkwkggggk  ",
            " kgggwkggkyyyyyyyyykggkwkgggk   ",
            "  kggkgggkyyyyyyyyykgggkgkgk    ",
            "   kkkgggkyykkkkyyykgggkkk      ",
            "      kgggkykkkkykgggkk         ",
            "       kggkkyyyykkggk           ",
            "       kggggkwwkggggk           ",
            "      kgggggkkkkgggggk          ",
            "     kggggkkk  kkkggggk         ",
            "    kgggyyk      kyyyggk        ",
            "    kyyyyyk      kyyyyyk        ",
            "    kyyyyyk      kyyyyyk        ",
            "     kkyyk        kyykk         ",
            "       kk          kk           ",
            "                                ",
            "                                ",
            "                                "
        ];
        this.cache['bowser_0'] = this.renderGrid(32, 32, bowserGrid, bowserPalette);
    }

    initMario() {
        const marioSmallPalette = {
            'r': '#d82800', // Red hat/shirt
            'b': '#0000bc', // Blue overalls
            's': '#fc9838', // Skin tone
            'k': '#000000'  // Black
        };

        // Small Mario Idle (16x16)
        const sIdle = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   sssbssssss   ",
            "   sssbbssssss  ",
            "   ssssbbbb     ",
            "     sssssss    ",
            "    rrbrr       ",
            "   rrrbrrr      ",
            "  rrrrbbbbrrrr  ",
            "  ss rbybbr ss  ",
            "  ss bbbbbb ss  ",
            "  ss bbbbbb ss  ",
            "    bbbbbbbb    ",
            "   bbbb  bbbb   ",
            "  kkkk    kkkk  "
        ];

        // Small Mario Run 1
        const sRun1 = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   sssbssssss   ",
            "   sssbbssssss  ",
            "   ssssbbbb     ",
            "     sssssss    ",
            "   rrrbrrrr     ",
            "  rrrrbbbbrr    ",
            "  ssrbbybbr s   ",
            "   bbbbbbbbb    ",
            "  bbbbbbbbbbb   ",
            " bbbbbbbbbbbb   ",
            " kkkkkk  bbbb   ",
            "          kkkk  ",
            "                "
        ];

        // Small Mario Run 2
        const sRun2 = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   sssbssssss   ",
            "   sssbbssssss  ",
            "   ssssbbbb     ",
            "     sssssss    ",
            "    rrbrr       ",
            "   rrrbrrr      ",
            "  rrrrbbbbrrrr  ",
            "  ss rbybbr ss  ",
            "     bbbbbb     ",
            "    bbbbbbbb    ",
            "   bbbb  bbbb   ",
            "  kkkk    kkkk  ",
            "                "
        ];

        // Small Mario Run 3
        const sRun3 = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   sssbssssss   ",
            "   sssbbssssss  ",
            "   ssssbbbb     ",
            "     sssssss    ",
            "      rbrrr     ",
            "    rrbbbbrrrr  ",
            "   ssrbbybbrss  ",
            "    bbbbbbbb    ",
            "   bbbbbbbbbbb  ",
            "   bbbb  bbbbbb ",
            "   kkkk   kkkkk ",
            "                ",
            "                "
        ];

        // Small Mario Jump
        const sJump = [
            "  ss rrrrr      ",
            "  ss rrrrrrrr   ",
            "     sssbbss    ",
            "    sssbssssss  ",
            "    sssbbssssss ",
            "    ssssbbbb    ",
            "   rrrrsssss    ",
            "  rrrrrrbrr     ",
            "  rrrrrrbbrr    ",
            "   rrrrbbbbss   ",
            "    bbbbbbbss   ",
            "   bbbbbbbb     ",
            "  bbbb  bbbb    ",
            "  kkkk   kkkk   ",
            "                ",
            "                "
        ];

        // Small Mario Dead
        const sDead = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   sssbssssss   ",
            "   sssbbssssss  ",
            "   ssssbbbb     ",
            "     sssssss    ",
            "    rrbrrr      ",
            "  ssrrrrbbss    ",
            "  ssrrrbbybbss  ",
            "    bbbbbb      ",
            "   bbbbbbbb     ",
            "  bbbb  bbbb    ",
            "  kkkk    kkkk  ",
            "                ",
            "                "
        ];

        this.cache['mario_small_idle'] = this.renderGrid(16, 16, sIdle, marioSmallPalette);
        this.cache['mario_small_run_0'] = this.renderGrid(16, 16, sRun1, marioSmallPalette);
        this.cache['mario_small_run_1'] = this.renderGrid(16, 16, sRun2, marioSmallPalette);
        this.cache['mario_small_run_2'] = this.renderGrid(16, 16, sRun3, marioSmallPalette);
        this.cache['mario_small_jump'] = this.renderGrid(16, 16, sJump, marioSmallPalette);
        this.cache['mario_small_dead'] = this.renderGrid(16, 16, sDead, marioSmallPalette);

        // Big Mario (16x32)
        const bigGridIdle = [
            "     rrrrr      ",
            "    rrrrrrrrr   ",
            "    rrrrrrrrr   ",
            "    sssbbss     ",
            "   ssssbssssss  ",
            "   ssssbbssssss ",
            "   ssssbbbb     ",
            "     ssssssss   ",
            "    rrbrrrr     ",
            "   rrrbrrrrr    ",
            "  rrrrbrrrrrr   ",
            "  rrrrbbbbrrrr  ",
            "  rrrrbbbbrrrr  ",
            "  ss rbybbr ss  ",
            "  ss rbybbr ss  ",
            "  ss bbbbbb ss  ",
            "     bbbbbb     ",
            "    bbbbbbbb    ",
            "   bbbbbbbbbb   ",
            "   bbbbbbbbbb   ",
            "  bbbbbbbbbbbb  ",
            "  bbbbbbbbbbbb  ",
            "  bbbbbbbbbbbb  ",
            "  bbbb    bbbb  ",
            "  bbbb    bbbb  ",
            "  bbbb    bbbb  ",
            "  bbbb    bbbb  ",
            "  kkkk    kkkk  ",
            "  kkkk    kkkk  ",
            " kkkkk    kkkkk ",
            "                ",
            "                "
        ];

        const bigGridJump = [
            "  ss rrrrr      ",
            "  ss rrrrrrrr   ",
            "     rrrrrrrrr  ",
            "     sssbbss    ",
            "    ssssbssssss ",
            "    ssssbbssssss",
            "    ssssbbbb    ",
            "   rrrrsssssss  ",
            "  rrrrrrbrrrr   ",
            "  rrrrrrrbrrrrr ",
            "  rrrrrrrbbbbrr ",
            "   rrrrbbbbbbrr ",
            "    bbbbbbbbss  ",
            "   bbbbbbbbsss  ",
            "  bbbbbbbbbb    ",
            "  bbbbbbbbbb    ",
            " bbbbbbbbbbbb   ",
            " bbbbbbbbbbbb   ",
            " bbbb    bbbb   ",
            " bbbb     bbbb  ",
            " bbbb     bbbb  ",
            " kkkk     bbbb  ",
            "          kkkk  ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                ",
            "                "
        ];

        this.cache['mario_big_idle'] = this.renderGrid(16, 32, bigGridIdle, marioSmallPalette);
        this.cache['mario_big_jump'] = this.renderGrid(16, 32, bigGridJump, marioSmallPalette);

        // Fire Mario uses White & Red palette!
        const firePalette = {
            'r': '#ffffff', // White hat / overalls
            'b': '#d82800', // Red shirt
            's': '#fc9838', // Skin tone
            'k': '#000000'
        };
        this.cache['mario_fire_idle'] = this.renderGrid(16, 32, bigGridIdle, firePalette);
        this.cache['mario_fire_jump'] = this.renderGrid(16, 32, bigGridJump, firePalette);
    }

    initCastle() {
        // Flagpole Ball & Shaft
        const { c: poleCanvas, ctx: pCtx } = this.createCanvas(16, 16);
        pCtx.fillStyle = '#00a800';
        pCtx.fillRect(7, 0, 2, 16);
        this.cache['flag_pole'] = poleCanvas;

        const { c: topCanvas, ctx: tCtx } = this.createCanvas(16, 16);
        tCtx.fillStyle = '#00a800';
        tCtx.beginPath();
        tCtx.arc(8, 8, 5, 0, Math.PI * 2);
        tCtx.fill();
        tCtx.fillRect(7, 10, 2, 6);
        this.cache['flag_top'] = topCanvas;

        // Flag (16x16)
        const flagPalette = { 'k': '#000000', 'g': '#00a800', 'w': '#ffffff' };
        const flagGrid = [
            "gggggggggg      ",
            "ggggggggkk      ",
            "ggggggkkwwk     ",
            "gggggkkwwwwk    ",
            "gggggkkkwwwwk   ",
            "ggggggkkkwwwk   ",
            "ggggggggkkwwk   ",
            "gggggggggkkk    ",
            "gggggggggg      ",
            "ggggggggg       ",
            "gggggggg        ",
            "gggggg          ",
            "gggg            ",
            "gg              ",
            "                ",
            "                "
        ];
        this.cache['flag'] = this.renderGrid(16, 16, flagGrid, flagPalette);

        // Castle Brick Wall
        const castleWallGrid = [
            "kkkkkkkkkkkkkkkk",
            "khhhhhhhhhhhhhhk",
            "khbbbbbbbbbbbbhk",
            "khbbbbbbbbbbbbhk",
            "khbbbbkkbbbbbbhk",
            "khbbbbkkbbbbbbhk",
            "khbbbbbbbbbbbbhk",
            "khbbbbbbbbbbbbhk",
            "khbbkkbbbbkkbbhk",
            "khbbkkbbbbkkbbhk",
            "khbbbbbbbbbbbbhk",
            "khbbbbbbbbbbbbhk",
            "khbbbbkkbbbbbbhk",
            "khbbbbkkbbbbbbhk",
            "khbbbbbbbbbbbbhk",
            "kkkkkkkkkkkkkkkk"
        ];
        const cWallPalette = {
            'k': '#000000',
            'h': '#fce4a0',
            'b': '#b84418'
        };
        this.cache['castle_brick'] = this.renderGrid(16, 16, castleWallGrid, cWallPalette);

        // Castle Door
        const { c: doorC, ctx: dCtx } = this.createCanvas(16, 16);
        dCtx.fillStyle = '#000000';
        dCtx.fillRect(0, 0, 16, 16);
        this.cache['castle_door'] = doorC;
    }

    draw(ctx, spriteName, x, y, w, h, flipX = false) {
        const sprite = this.cache[spriteName];
        if (!sprite) return;

        ctx.save();
        if (flipX) {
            ctx.translate(Math.floor(x + w), Math.floor(y));
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0, w, h);
        } else {
            ctx.drawImage(sprite, Math.floor(x), Math.floor(y), w, h);
        }
        ctx.restore();
    }
}

// Global sprite renderer singleton
window.sprites = new SpriteRenderer();
