import { NextResponse } from "next/server";
import { auth, store } from "../../../lib/store";

export async function POST(req: Request) {
  const u = auth(req);

  if (!u) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401 }
    );
  }

  const { postId } = await req.json();

  const key = `${u.id}:${postId}`;
  const post = store.posts.find((x) => x.id === postId);

  if (!post) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    );
  }

  if (store.likes.has(key)) {
    store.likes.delete(key);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    store.likes.add(key);
    post.likes++;
  }

  return NextResponse.json({
    liked: store.likes.has(key),
    likes: post.likes,
  });
}