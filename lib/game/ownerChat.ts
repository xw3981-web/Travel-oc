import type { Locale } from "@/lib/i18n/locale";
import { createRng } from "./random";

/**
 * After a long focus session the OC asks what the owner was doing and answers
 * with a short, warm reply. Mock mode classifies the answer by keywords; an LLM
 * provider can replace this through AIService.respondToOwner.
 */

/** Trips at least this long (completed, not interrupted) end with the OC asking. */
export const CHAT_MIN_MINUTES = 60;

export type ActivityCategory =
  | "study"
  | "code"
  | "write"
  | "draw"
  | "work"
  | "read"
  | "exercise"
  | "music"
  | "chores"
  | "rest"
  | "other";

const KEYWORDS: [Exclude<ActivityCategory, "other">, string[]][] = [
  ["code", ["代码", "编程", "程序", "bug", "debug", "写码", "开发", "前端", "后端", "code", "coding", "program", "develop", "deploy"]],
  ["write", ["论文", "写作", "报告", "稿", "文章", "小说", "作文", "essay", "thesis", "paper", "writing", "write", "report", "draft", "novel"]],
  ["study", ["学习", "复习", "考试", "作业", "背单词", "单词", "上课", "网课", "刷题", "预习", "考研", "雅思", "托福", "study", "studying", "exam", "homework", "revise", "revision", "class", "lecture", "learn"]],
  ["draw", ["画", "插画", "设计", "建模", "原画", "上色", "草稿", "draw", "drawing", "sketch", "paint", "illustrat", "design", "artwork"]],
  ["read", ["读书", "看书", "阅读", "书", "read", "reading", "book"]],
  ["exercise", ["运动", "跑步", "健身", "瑜伽", "锻炼", "游泳", "跳舞", "run", "running", "gym", "workout", "yoga", "exercise", "swim", "dance"]],
  ["music", ["练琴", "钢琴", "吉他", "音乐", "唱歌", "乐器", "编曲", "piano", "guitar", "music", "sing", "practice", "practise"]],
  ["chores", ["家务", "打扫", "收拾房间", "做饭", "洗衣", "clean", "cook", "laundry", "tidy", "chores"]],
  ["rest", ["休息", "睡觉", "发呆", "躺", "午睡", "rest", "nap", "sleep", "relax", "chill"]],
  ["work", ["工作", "开会", "加班", "项目", "邮件", "上班", "ppt", "表格", "汇报", "work", "meeting", "project", "email", "job", "office", "slides"]],
];

/** Chinese keywords match anywhere; English ones must start a word ("read" ≠ "already"). */
function matches(text: string, word: string): boolean {
  return /^[a-z]/.test(word) ? new RegExp(`\\b${word}`).test(text) : text.includes(word);
}

export function classifyActivity(text: string): ActivityCategory {
  const t = text.toLowerCase();
  for (const [category, words] of KEYWORDS) if (words.some((w) => matches(t, w))) return category;
  return "other";
}

type ReplyPool = Record<ActivityCategory, string[]> & { long: string };

/** `{time}` = how long they focused, `{activity}` = what they typed. Arrays must stay index-aligned across languages. */
const REPLIES: Record<Locale, ReplyPool> = {
  en: {
    study: [
      "Oh, you were studying. {time} is longer than my whole walk today. Knowledge is like a road: every bit you've covered counts.",
      "Tired from studying? I found a pretty leaf on the way. You can use it as a bookmark. What you learned today will quietly become yours by tomorrow.",
    ],
    code: [
      "Coding! I don't really get it, but I know every bug is just a pebble on the path. Kick it aside and keep walking.",
      "You built something one line at a time while I walked one step at a time. We both made something today.",
    ],
    write: [
      "Writing, huh. I think writing is like traveling: you don't know where you're going until you get there.",
      "{time} of writing. There must be a few really good lines in there. It's fine if it's not finished. Good sentences wait for you.",
    ],
    draw: [
      "You were drawing! I wanted to bring back every colour I saw today for your palette.",
      "Every stroke gets a little closer to what you're picturing. Like every step got me a little closer to the sea.",
    ],
    work: [
      "Good work today. {time} of focus is more than most grown-ups manage. You did great.",
      "The work never really ends, but you finished today's stretch properly. Leave the rest for tomorrow-you.",
    ],
    read: [
      "You were reading! I wonder whose trip went further, mine or the book's. Tell me about it sometime.",
      "Every book you read becomes a window. You opened another one today.",
    ],
    exercise: [
      "You were exercising! We both moved a lot today. Sore legs are just your body saying thanks.",
      "When you sweat, a few worries evaporate too. Feeling a little lighter?",
    ],
    music: [
      "Practising music! The wind was practising on my walk too. It hit a few wrong notes as well.",
      "Practice feels slow, but every round gets a little better. Like all those steps I climbed.",
    ],
    chores: [
      "You were tidying up! No wonder the room feels brighter. Thank you.",
      "Looking after everyday life is a big deal too.",
    ],
    rest: [
      "You were resting. Good. Resting isn't slacking. It's charging up for the next stretch.",
      "When you zone out, your head is quietly tidying things up. I do that a lot.",
    ],
    other: [
      "So you were busy with \"{activity}\". Whatever it was, you stuck with it for {time}. I think that's amazing.",
      "\"{activity}\" sounds important. You do the important things, I'll go see the world, and then we swap stories.",
    ],
    long: "You kept at it for so long. Next time I want to walk further too.",
  },
  zh: {
    study: [
      "原来你在学习呀。{time}，比我今天走的路还长。知识和路一样，走过的都算数。",
      "学累了吧？我在路上捡了一片很好看的叶子，借你夹在书里。今天记住的东西，明天会悄悄变成你的。",
    ],
    code: [
      "写代码呀！我不太懂，但我知道每个bug都是路上的小石子，踢开了就能继续走。",
      "你一行一行地搭东西，我一步一步地走路。我们今天都造了点什么。",
    ],
    write: [
      "在写东西呀。我觉得写字和旅行很像：一开始不知道会去哪，写着写着就到了。",
      "{time}的字，一定有几句特别好的。没写完也没关系，好句子会等你的。",
    ],
    draw: [
      "你在画画！我今天看到的颜色，都想带回来给你当颜料。",
      "每一笔都离你想画的样子更近一点。就像我每一步都离海更近一点。",
    ],
    work: [
      "工作辛苦啦。认真了{time}，很多大人都做不到。你已经很厉害了。",
      "事情是做不完的，但今天这一段，你已经好好走完了。剩下的交给明天的你吧。",
    ],
    read: [
      "你在看书呀。书里的世界和我去的地方，哪个更远呢？下次讲给我听吧。",
      "读过的书会变成你看世界的窗户。今天又多开了一扇。",
    ],
    exercise: [
      "你去运动了！我们今天都走了好多路呢。腿酸的感觉，是身体在说谢谢。",
      "流汗的时候，烦恼也会跟着蒸发一点。今天的你轻了一点点吧？",
    ],
    music: [
      "你在练习音乐呀。我在路上也听到风在练习，它也弹错了好几次。",
      "重复的练习看起来很慢，但每一遍都在变好。就像我爬过的那些台阶。",
    ],
    chores: ["你在收拾家呀，难怪我回来觉得房间亮了一点。谢谢你。", "把生活照顾好，也是很了不起的事。"],
    rest: [
      "你在休息呀。那很好。休息不是偷懒，是给下一段路充电。",
      "发呆的时候，脑袋其实在悄悄整理东西。我也经常这样。",
    ],
    other: [
      "原来你在忙「{activity}」呀。不管是什么，你认真了{time}，我都觉得很了不起。",
      "「{activity}」听起来很重要。你去做重要的事，我去看看世界，我们回来再交换故事。",
    ],
    long: "这么久都没放弃。下次我也要走得更远一点。",
  },
};

export const LONG_FOCUS_MINUTES = 120;

/** Deterministic reply key for a given trip and answer, e.g. "study:1". */
export function pickReplyKey(category: ActivityCategory, seed: string): string {
  const options = REPLIES.en[category];
  return `${category}:${Math.floor(createRng(seed, `chat:${category}`).next() * options.length)}`;
}

export function replyText(
  key: string,
  locale: Locale,
  vars: { time: string; activity: string; minutes: number },
): string | undefined {
  const [category, i] = key.split(":");
  const line = REPLIES[locale][category as ActivityCategory]?.[Number(i)];
  if (!line) return undefined;
  const raw = vars.activity.trim();
  const activity = raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
  const text = line.replaceAll("{time}", vars.time).replaceAll("{activity}", activity);
  const persevered = vars.minutes >= LONG_FOCUS_MINUTES && category !== "rest" && category !== "chores";
  return persevered ? `${text}${locale === "zh" ? "" : " "}${REPLIES[locale].long}` : text;
}

/** For content checks: every category must have the same number of replies in each language. */
export function replyPoolsAligned(): boolean {
  return (Object.keys(REPLIES.en) as (keyof ReplyPool)[]).every((k) => {
    const a = REPLIES.en[k];
    const b = REPLIES.zh[k];
    return typeof a === "string" ? typeof b === "string" : Array.isArray(b) && a.length === b.length;
  });
}
