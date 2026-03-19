# Project Overview

Du an nay la bo khung game 2D lane defense + action chay tren trinh duyet voi Phaser 3.
Kien truc chia ro thanh 3 lop va mo rong theo huong nho gon:

- `entities`: mo ta doi tuong trong game + hanh vi co ban
- `systems`: luat van hanh (spawn, tai nguyen, chien dau)
- `scenes`: dieu phoi vong doi game va UI

Muc tieu la giu logic de doc, de sua, de them tinh nang ma khong can build tool.

# File Responsibilities

- `index.html`: diem vao trinh duyet, nap Phaser CDN va module `main.js`
- `main.js`: khoi tao Phaser game bang cau hinh trung tam
- `src/config.js`: tat ca thong so can bang (unit, enemy, wave, skill, combat)
- `src/entities.js`: class `Enemy` va cac bien the, `Unit` va cac bien the, `Player`, `Bullet`
- `src/systems.js`: `WaveSystem`, `ResourceSystem`, `CombatSystem`, `SkillSystem`
- `src/GameScene.js`: gameplay chinh, cap nhat game loop, game over
- `src/UIScene.js`: hien thi HP, coin, energy, wave, skill cooldown, huong dan skill
- `docs/guide.md`: tai lieu kien truc va quy tac phat trien
- `assets/`: de trong, dung cho tai nguyen sau nay

# How To Run

1. Mo file `game/index.html` bang trinh duyet.
2. Game chay ngay, khong can cai dat them.

Luu y: project dung ES6 modules, nen can mo truc tiep dung duong dan file trong thu muc `game`.

# How To Extend

## Add New Enemy

1. Tao class moi trong `src/entities.js` (vi du `FastEnemy extends Enemy`).
2. Them stat rieng (hp/speed).
3. Trong `WaveSystem.spawnEnemy()` tai `src/systems.js`, doi logic spawn theo dieu kien wave.

## Add New Unit

1. Tao class unit moi trong `src/entities.js` hoac dung `Unit` voi stat moi.
2. Khoi tao them instance trong `GameScene.create()`.
3. Trong `CombatSystem.updateUnitAttacks()`, bo sung cach chon target/ban dan cho unit moi.

## Change Balance

- Sua thong so trong `src/config.js`:
- `UNIT_STATS` de doi range/damage/attackSpeed
- `PLAYER_STATS` de doi melee/ranged
- `ENEMY_STATS`, `WAVE_CONFIG`, `SKILL_CONFIG` de doi nhip do game

## Add New System

1. Tao class system moi trong `src/systems.js` (vi du `SkillSystem`).
2. Khoi tao trong `GameScene.create()`.
3. Goi `system.update(...)` trong `GameScene.update()`.
4. Neu can hien thi UI, ghi du lieu vao `registry` va doc o `UIScene`.

# Development Rules

- Logic doi tuong dat trong `entities.js`.
- Luat choi va tinh toan dat trong `systems.js`.
- Scene chi dieu phoi va cap nhat vong doi.
- Khong dat bien global moi ngoai scene/state hien tai.
- Khi them tinh nang, uu tien sua file dung trach nhiem thay vi nhet het vao `GameScene`.
- Ten class/ham ro nghia, ngan gon, thong nhat cach dat ten hien co.

# Unit System

- `Plant` da duoc thay bang `Unit` de mo rong trong tuong lai.
- `Unit` van giu hanh vi dung yen va auto attack nhu truoc.
- Co san `MeleeUnit` va `RangedUnit` de mo rong role ma khong doi kien truc.
- Danh sach quyen so huu cua scene la `units[]`.

# Enemy Types

- `NormalEnemy`: can bang, xuat hien som.
- `FastEnemy`: mau thap, toc do cao, chen vao mid/late wave.
- `TankEnemy`: mau cao, toc do cham, xuat hien late wave.
- `WaveSystem` chon loai enemy theo wave va xac suat trong `WAVE_CONFIG`.

# Skill System

- `SkillSystem` nam trong `src/systems.js`.
- Skill tornado kich hoat bang phim `Q`.
- Skill danh tat ca enemy tren lane, gay damage va day lui mot khoang ngan.
- Skill co `energyCost` va `cooldownMs`, tat ca dat trong `SKILL_CONFIG`.

# Input Handling

- Click chuot tren map de deploy unit.
- LMB deploy `RangedUnit`, RMB deploy `MeleeUnit`.
- Neu khong du energy thi chan deploy va hien feedback text.
- Bam `Q` de dung tornado khi du energy va het cooldown.

# Player Movement

- Player di chuyen ngang bang `A/D` hoac mui ten trai/phai.
- Input va movement duoc xu ly trong `GameScene`, khong dua vao systems.
- Toc do di chuyen su dung `PLAYER_SPEED` trong `src/config.js`.
- Vi tri player duoc clamp trong man hinh, khong the ra ngoai bien.
- Movement cap nhat truoc combat moi frame de dam bao tinh khoang cach tan cong dung theo vi tri hien tai.
- Combat van la auto va distance-based, khong doi co che cooldown.
- Huong di chuyen duoc luu de flip trai/phai va co scale nhe khi dang di chuyen.

Luu y: movement khong thay doi architecture, systems van chi xu ly luat game/combat.

# UI System

- `UIScene` la lop display-only, khong chua gameplay logic.
- `UIScene` doc du lieu tu `registry` moi frame trong `update()`.
- UI hien thi day du: HP, coin, energy, wave, thong tin skill, panel deploy unit.
- Skill panel hien: ten skill, energy cost, trang thai `READY` / cooldown / `NO ENERGY`.
- Bottom panel hien dieu khien deploy:
  - `Ranged Unit (LMB)` + cost
  - `Melee Unit (RMB)` + cost
  - Neu khong du energy, text doi mau canh bao.

# Player Feedback

- UI truyen dat trang thai nang luong va kha nang dung skill theo thoi gian thuc.
- Wave doi thi co banner `WAVE X` hien ngan gon de player nhan biet.
- Loi thao tac (vi du khong du energy, skill dang cooldown) duoc day tu `GameScene` vao `registry` va `UIScene` chi render floating message roi huy.

# Registry Contract

- `GameScene` ghi du lieu UI vao `registry`:
  - `baseHP`
  - `coin`
  - `energy`
  - `wave`
  - `skillCooldown` (ms)
  - `skillReady` (boolean)
  - `uiMessage` (object event cho feedback text)
- `UIScene` chi doc cac key nay de render.
- Khong co chieu nguoc tu UI qua gameplay state.

# Progression System

- Level cua unit duoc luu trong `GameScene` (`rangedLevel`, `meleeLevel`).
- Unit stat scale dong khi tan cong (khong mutate base stats):
  - damage scale theo level
  - attack speed scale theo level
- UI panel hien level hien tai va upgrade cost cua tung loai unit.

# Upgrade Logic

- Input nang cap dat trong `GameScene`:
  - phim `1`: upgrade ranged
  - phim `2`: upgrade melee
- `UpgradeSystem` chi tinh cost + validate coin, khong so huu level.
- Cost tang theo level theo cong thuc linear:
  - `cost = BASE_UPGRADE_COST * (1 + level * COST_SCALE)`
- Neu du coin: tru coin, tang level, day message `Upgrade successful`.
- Neu thieu coin: day message `Not enough coin`.

# Scaling Philosophy

- Uu tien linear scaling de de can bang va de test.
- Enemy hp/speed tang vua phai theo wave.
- So luong enemy moi wave tang dan theo nhip cham.
- Coin reward va energy regen tang nhe theo wave de giu nhip progression.
- Tranh exponential growth de khong bi overpower hoac impossible.

# Performance Notes

- Enemy chet bat buoc: remove khoi `enemies[]` + `destroy()`.
- Bullet ket thuc bat buoc: remove khoi `bullets[]` + `destroy()`.
- Khong luu mang persistent trong system; system chi xu ly du lieu scene dang quan ly.
- Hieu ung text/hit duoc tween xong roi huy de tranh memory leak.

# Next Features Suggestion

- He thong skill nang cao cho player va unit.
- Nhieu loai enemy (tank, fast, support).
- He thong nang cap (damage, speed, range).
- UI tot hon: icon tai nguyen, thanh HP base, hieu ung hit.
