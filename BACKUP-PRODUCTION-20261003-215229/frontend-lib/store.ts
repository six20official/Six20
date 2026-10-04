import crypto from "crypto";

type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  password: string;
  avatarUrl?: string | null;
};

type Post = {
  id: string;
  userId: string;
  caption: string;
  image: string;
  sound: string;
  likes: number;
  comments: number;
  createdAt: string;
};

type Comment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
};

type Six20Store = {
  users: User[];
  posts: Post[];
  likes: Set<string>;
  follows: Set<string>;
  comments: Comment[];
  tokens: Map<string, string>;
};

const g = globalThis as typeof globalThis & {
  six20Store?: Six20Store;
};

if (!g.six20Store) {
  const creator: User = {
    id: "u1",
    username: "six20creator",
    email: "creator@six20.local",
    displayName: "SIX20 Creator",
    password: "password123",
  };

  g.six20Store = {
    users: [creator],

    posts: [
      {
        id: "1",
        userId: "u1",
        caption: "Welcome to SIX20 🇳🇬🔥",
        image:
          "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
        sound: "SIX20 Sounds",
        likes: 12400,
        comments: 842,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        userId: "u1",
        caption: "Lagos energy is different! 🌴✨",
        image:
          "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
        sound: "Lagos Vibes",
        likes: 8900,
        comments: 421,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        userId: "u1",
        caption: "Who is ready for this? 🎮🔥",
        image:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
        sound: "SIX20 Beats",
        likes: 21700,
        comments: 1200,
        createdAt: new Date().toISOString(),
      },
    ],

    likes: new Set<string>(),
    follows: new Set<string>(),
    comments: [],
    tokens: new Map<string, string>(),
  };
}

export const store = g.six20Store!;

export const id = () => crypto.randomUUID();

export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl ?? null,
  };
}

export function auth(req: Request) {
  const header = req.headers.get("authorization") || "";
  const tokenValue = header.replace(/^Bearer\s+/i, "");
  const userId = store.tokens.get(tokenValue);

  return userId
    ? store.users.find((user) => user.id === userId) || null
    : null;
}

export function token() {
  return crypto.randomBytes(32).toString("hex");
}
