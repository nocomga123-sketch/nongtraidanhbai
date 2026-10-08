avatar-mini-farm/
├── index.html              # Chỉ chứa thẻ HTML khung và load các script
├── css/
│   └── style.css           # Custom CSS & Tailwind styles
└── js/
    ├── config/
    │   ├── constants.js    # Cấu hình chung (thời gian, kích thước ô đất, key save...)
    │   └── database.js     # Chứa CROPS_DB, TREES_DB, RECIPES_DB, FISH_DB,...
    ├── state/
    │   └── gameState.js    # Khởi tạo, lưu (save), tải (load) & cập nhật State
    ├── render/
    │   ├── scene.js        # Khởi tạo Three.js (Camera, Light, Renderer, Weather)
    │   ├── models.js       # Các hàm vẽ 3D (vẽ Cây, Con vật, Nhân vật, Bếp)
    │   └── hud.js          # Vẽ & cập nhật thanh HUD bay (Floating HUD)
    ├── ui/
    │   ├── uiController.js # Cập nhật UI 2D (Vàng, Thể lực, Level, EXP)
    │   └── modals.js       # Xử lý đóng/mở & render nội dung các Modal (Shop, Kitchen, Minigames)
    ├── minigames/
    │   ├── horseRace.js    # Logic Đua ngựa
    │   └── bauCua.js       # Logic Bầu cua
    └── app.js              # File chính (Main Loop & Lắng nghe sự kiện click/tap)
