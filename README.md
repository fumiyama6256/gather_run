# GatherRun

ケニア式ランニングマッチングアプリ - 「今から走る」をその場で投稿、誰でも自由に参加できる超シンプルな掲示板

## 概要

GatherRunは、ランナーが気軽に集まって一緒に走れるようにするためのアプリです。
事前のプロフィール登録や承認は不要。地図にピンを立てて「今から走る」を投稿するだけ。

## 技術スタック

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + PostGIS)
- **Map**: React Native Maps
- **Language**: TypeScript

## ディレクトリ構造

```
gatherrun/
├── App.tsx                 # エントリーポイント
├── app.json               # Expo設定
├── src/
│   ├── screens/          # 画面コンポーネント
│   │   └── MapScreen.tsx # 地図画面
│   ├── components/       # 再利用可能なコンポーネント
│   ├── lib/             # ライブラリ設定
│   │   └── supabase.ts  # Supabaseクライアント
│   ├── types/           # TypeScript型定義
│   └── services/        # ビジネスロジック
└── supabase/
    ├── config.toml      # Supabase設定
    └── migrations/      # DBスキーマ
```

## 開発環境のセットアップ

### 必要なツール
- Node.js 18+
- npm or yarn
- Expo CLI
- Docker（Supabase用）

### セットアップ手順

1. **依存関係のインストール**
```bash
cd gatherrun
npm install
```

2. **Supabaseローカル環境の起動**
```bash
npx supabase start
```

初回起動時はDockerイメージのダウンロードに時間がかかります。
起動が完了すると、以下のような情報が表示されます：

```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **環境変数の設定**

実機でテストする場合は、PCのローカルIPアドレスを設定します：

```bash
# PCのIPアドレスを確認（Mac）
ifconfig | grep "inet " | grep -v 127.0.0.1

# .envファイルを編集
# EXPO_PUBLIC_SUPABASE_URL=http://[あなたのPCのIP]:54321
# 例: EXPO_PUBLIC_SUPABASE_URL=http://192.168.10.105:54321
```

**重要**:
- シミュレータでテストする場合は `http://127.0.0.1:54321` でOK
- 実機（Expo Go）でテストする場合は必ずPCのローカルIPに変更すること
- PCとスマホが同じWiFiに接続されている必要があります

4. **アプリの起動**
```bash
npm start
```

Expo Goアプリでスキャンするか、以下でシミュレータを起動：
- iOS: `i` キーを押す
- Android: `a` キーを押す

### Supabase Studioの使用

ローカルデータベースを確認するには：
```
http://127.0.0.1:54323
```

## 機能

### 実装済み ✅
- 📍 地図上で現在地周辺の募集を表示
- 🔄 リアルタイムで新しい募集を受信
- ✍️ Run投稿機能
  - 地図タップで場所選択
  - 現在地で投稿
  - 日時選択
  - トレーニング内容入力
- 📌 マーカーをタップして詳細を表示（基本）

### 今後追加予定
- 🙏 「ありがとう！」機能
- 📱 Run詳細表示（ボトムシート）
- 🔍 日時・距離での絞り込み
- 🎨 UI/UX改善

## データベーススキーマ

```sql
CREATE TABLE runs (
  id uuid PRIMARY KEY,
  location geography(POINT),  -- 緯度経度
  location_name text,         -- 場所名
  datetime timestamp,         -- 開催日時
  description text,           -- トレーニング内容
  note text,                  -- 一言メモ
  thanks_count int,           -- お礼カウント
  created_at timestamp
);
```

## トラブルシューティング

### Supabaseが起動しない
```bash
npx supabase stop
npx supabase start
```

### 地図が表示されない
- Google Maps APIキーが必要な場合があります
- `app.json`の`googleMapsApiKey`を設定してください

## ライセンス

MIT
