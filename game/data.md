# Data Dictionary

Tai lieu nay tong hop nhanh toan bo doi tuong va du lieu chinh trong game.
Muc tieu: ngan gon, de tra cuu, de mo rong.

## 1) Character va Entity

### Base

- y nghia: Can cu cua nguoi choi.
- du lieu chinh:
  - `baseHp`: mau hien tai cua base.
  - `baseMaxHp`: mau toi da cua base.
  - `baseX`: vi tri X cua base tren lane.
- luat: base ve 0 HP thi game over.

### Player

- y nghia: Nhan vat nguoi choi dieu khien ngang lane.
- du lieu chinh:
  - `maxHp`, `currentHp`: mau toi da/mau hien tai.
  - `moveSpeed`: toc do di chuyen.
  - `meleeRange`, `rangedRange`: tam danh gan/xa.
  - `meleeDamage`, `rangedDamage`: sat thuong gan/xa.
  - `attackSpeed`: toc do tan cong (lan/giay).
  - `nextAttackAt`: moc thoi gian duoc tan cong tiep.
  - `isDead`: trang thai chet.
  - `respawnAt`: thoi diem hoi sinh.
  - `facing`: huong nhin (trai/phai).
- luat:
  - HP ve 0 -> khong destroy, doi trang thai dead.
  - Sau 5s (theo config) -> hoi sinh tai vi tri gan base.

### Unit

- y nghia: Dong minh do player trien khai.
- du lieu chung:
  - `unitType`: loai unit.
  - `maxHp`, `currentHp`: mau.
  - `range`: tam danh.
  - `damage`: sat thuong.
  - `attackSpeed`: toc do tan cong.
  - `bulletSpeed`: toc do dan (neu danh xa).
  - `moveSpeed`: toc do tien/luu theo lane.
  - `nextAttackAt`: cooldown tan cong.
  - `isAlive`: con song hay khong.
- luat:
  - Tim enemy gan nhat.
  - Ngoai tam -> di chuyen toi.
  - Trong tam -> tan cong theo cooldown.

### MeleeUnit

- y nghia: Unit can chien.
- dac diem: range ngan, damage cao, bulletSpeed = 0.

### RangedUnit

- y nghia: Unit danh xa.
- dac diem: range xa, ban dan.

### Enemy

- y nghia: Ke dich di tu phai sang trai tan cong phe phong thu.
- du lieu chung:
  - `maxHp`, `currentHp` (`hp`): mau.
  - `speed`: toc do di chuyen.
  - `attackDamage`: sat thuong danh vao Unit/Player/Base.
  - `attackRange`: tam tan cong.
  - `attackSpeed`: toc do tan cong.
  - `nextAttackAt`: cooldown tan cong.
  - `rewardCoin`: coin thuong khi bi tieu diet.
  - `enemyType`: loai enemy (`normal`, `fast`, `tank`).
  - `isAlive`: con song hay khong.
- luat:
  - Neu toi base co the tru HP base.
  - Uu tien target theo khoang cach, tie-break: Unit > Player > Base.

### NormalEnemy

- y nghia: Enemy can bang.
- dac diem: mau/toc do trung binh.

### FastEnemy

- y nghia: Enemy toc do cao.
- dac diem: HP thap, di nhanh.

### TankEnemy

- y nghia: Enemy trau.
- dac diem: HP cao, di cham, damage thuong cao hon.

### Bullet

- y nghia: Dan ban ra tu player hoac ranged unit.
- du lieu:
  - `target`: muc tieu dang bay toi.
  - `damage`: sat thuong.
  - `speed`: toc do bay.
- luat:
  - Cham target -> gay sat thuong, roi bi huy.
  - Target da chet/mat active -> dan tu huy.

## 2) Animation va Visual Feedback

### Hit Flash

- y nghia: hieu ung nhap nhay khi trung don.
- ap dung: Player, Unit, Enemy, thanh mau.

### Floating Damage Text

- y nghia: chu so sat thuong bay len roi mo dan.
- ap dung: khi entity/base nhan damage, hoac canh bao nang luong.

### Wave Pulse

- y nghia: text Wave phong to nhe khi sang wave moi.

### Tornado Wave FX

- y nghia: hieu ung vung song khi cast skill tornado.

### Smooth Bar Lerp

- y nghia: thanh HP/Energy tren UI cap nhat mem, khong giat.

## 3) Unit Type va Cost

### Unit Types

- `melee`: unit can chien.
- `ranged`: unit danh xa.

### Deploy Cost

- `UNIT_DEPLOY_COST`: nang luong can de trien khai 1 unit.
- neu khong du energy -> khong deploy.

## 4) Player Inputs

- `A`/`D` hoac mui ten trai/phai: di chuyen player.
- `Q`: dung skill Tornado (neu du nang luong va het cooldown).
- `1`: nang cap ranged unit.
- `2`: nang cap melee unit.
- Click panel day:
  - 1/3 trai: deploy ranged.
  - 1/3 giua: deploy melee.

## 5) Resource va Currency

### Energy (Nang luong)

- y nghia: tai nguyen de deploy unit va dung skill.
- du lieu:
  - `energy`: nang luong hien tai.
  - `MAX_ENERGY`: gioi han tren.
- nguon tang:
  - tu `ResourceSystem` theo chu ky.
- muc tieu su dung:
  - deploy unit.
  - cast skill.

### Coin

- y nghia: tien de nang cap unit.
- du lieu:
  - `coin`: coin hien tai.
- nguon tang:
  - tieu diet enemy (`rewardCoin`, co scale theo wave).
- muc tieu su dung:
  - upgrade ranged/melee level.

## 6) Combat Terms

- `hp`: thanh mau / so mau hien tai.
- `maxHp`: mau toi da.
- `damage`: sat thuong moi lan danh.
- `attackSpeed`: toc do danh (lan/giay).
- `range`: tam tan cong.
- `cooldown`: thoi gian cho de dung lai hanh dong.
- `nextAttackAt`: moc thoi gian tan cong tiep theo.
- `isAlive`: con song.
- `isDead`: trang thai chet (dac biet cho player).

## 7) Systems

### WaveSystem

- y nghia: tao enemy theo nhip wave.
- du lieu chinh:
  - `wave`, `spawnInterval`, `enemiesPerWave`, `spawnedInWave`.
- luat:
  - wave tang dan, loai enemy va do kho scale theo cau hinh.

### ResourceSystem

- y nghia: hoi energy theo thoi gian.
- luat:
  - wave cao hon co the hoi nhanh hon nhe.
  - coin reward scale theo wave.

### CombatSystem

- y nghia: xu ly tan cong, sat thuong, dan, chet/loai bo.
- nhiem vu:
  - Unit auto attack.
  - Enemy attack target phong thu.
  - Player auto attack theo khoang cach.
  - cap nhat Bullet.

### SkillSystem

- y nghia: xu ly skill Tornado.
- luat:
  - tru energy.
  - kiem tra cooldown.
  - gay damage + day lui tat ca enemy tren lane.

### UpgradeSystem

- y nghia: tinh cost va validate nang cap.
- luat:
  - cost tang theo level.
  - neu du coin -> tang level, tru coin.

## 8) UI Data (Registry Contract)

`GameScene` ghi, `UIScene` chi doc:

- `baseHP`, `maxHP`
- `coin`
- `energy`, `maxEnergy`
- `wave`
- `skillCooldown`, `skillCooldownMs`
- `skillReady`
- `rangedLevel`, `meleeLevel`
- `upgradeCostRanged`, `upgradeCostMelee`
- `uiMessage`
- `gameOver`

## 9) Quick Glossary (Theo vi du ban yeu cau)

- `hp`: thanh mau.
- `enemies`: danh sach tat ca ke dich dang ton tai.
- `enemy`: 1 ke dich cu the.
- `energy`: nang luong de deploy/skill.
- `coin`: tien de nang cap.
- `unit`: dong minh do player trien khai.
- `player`: nhan vat nguoi choi.
- `bullet`: vien dan tan cong muc tieu.
- `wave`: dot tan cong.
- `cooldown`: thoi gian cho truoc khi dung lai duoc.
