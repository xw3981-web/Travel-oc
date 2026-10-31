import type { Locale } from "@/lib/i18n/locale";
import type { OCPersonality } from "@/types/oc";
import type { FoodType, TimeOfDay, Weather } from "@/types/journey";

/**
 * Generic diary sentences shared by every destination. Both languages must keep
 * the same array lengths and closer ids: diaries are stored as keys into these.
 */
export type DiaryPools = {
  weather: Record<Weather, string[]>;
  time: Partial<Record<TimeOfDay, string[]>>;
  transit: Record<number, string[]>;
  food: Record<FoodType, string[]>;
  early: string[];
  closers: Record<CloserId, string>;
  /** P.S. to the owner after an early return: gentle, never guilt-tripping. */
  comfort: string[];
  /** P.S. to the owner after a full trip: a small reflective thought. */
  musing: string[];
};

export type CloserId = "back" | "legs" | "forgot" | "curious" | "social" | "solo" | "adventurous";

/** Which closing lines fit an OC's personality. Order matters for determinism. */
export const CLOSERS: { id: CloserId; when?: (p: OCPersonality) => boolean }[] = [
  { id: "back" },
  { id: "legs" },
  { id: "forgot" },
  { id: "curious", when: (p) => p.curiosity > 0.6 },
  { id: "social", when: (p) => p.sociability > 0.6 },
  { id: "solo", when: (p) => p.sociability < 0.4 },
  { id: "adventurous", when: (p) => p.adventurousness > 0.6 },
];

const en: DiaryPools = {
  weather: {
    sunny: ["The sun was out the whole time.", "It was the kind of sunny where everything looks freshly washed."],
    cloudy: ["It was cloudy, but the soft kind.", "The sky was one big grey blanket. I didn't mind."],
    drizzle: ["It drizzled a little. I walked under the shop awnings.", "There was a light rain. Everything smelled like wet stone."],
    windy: ["It was windy. My hair has opinions now.", "The wind kept pushing me in the direction I was already going."],
    foggy: ["It was foggy, so everything appeared one thing at a time."],
    snowy: ["It was snowing. Small, slow flakes."],
  },
  time: {
    morning: ["I left early. The streets were still waking up."],
    evening: ["By the time I got there the light was going orange."],
    night: ["It was dark out, but the nice kind of dark."],
  },
  transit: {
    2: ["I took the bus and sat at the very back."],
    3: ["I took the bus, then walked the last bit."],
    4: ["I took the train. Then a smaller train."],
    5: ["It was a long way. I changed trains three times and didn't get lost once. Okay, once."],
  },
  food: {
    riceball: [
      "I ate the rice ball sitting on a low wall. The seaweed had gone a bit soft, which I like.",
      "I saved half the rice ball for later, then ate it right away.",
    ],
    sandwich: [
      "I ate the sandwich standing up, like a busy person.",
      "A bird watched me eat the sandwich. I gave it nothing. Okay, one crumb.",
    ],
    cookies: ["I had a cookie. Then another one, to check.", "The cookies got a little crushed in my bag. Still good."],
  },
  early: [
    "I came home a little early. That's alright.",
    "I turned around halfway. The rest will still be there next time.",
    "I didn't go far this time, but I went.",
  ],
  closers: {
    back: "Anyway, I'm back.",
    legs: "My legs are tired in a good way.",
    forgot: "I almost forgot to come home.",
    curious: "I want to go back and look at the part I missed.",
    social: "Someone said hi to me. I said hi back. Big day.",
    solo: "I didn't talk to anyone. It was perfect.",
    adventurous: "I took one wrong turn on purpose.",
  },
  comfort: [
    "We came back early this time, but I think setting off is already the brave part.",
    "The road isn't going anywhere. Next time we'll pick up right where we stopped.",
    "Coming home early is fine. Sometimes stopping is how you get ready to go further.",
    "Even a short walk had plenty to look at. I bet your day did too.",
    "You don't have to finish every trip. The moon isn't full every night either.",
  ],
  musing: [
    "After walking a long way I figured it out: every long road is just one step, then another. Same as your day.",
    "Views never rush anyone. We can take our time too.",
    "I thought of you on the way. You focusing probably looks a lot like me staring at the sea.",
    "When a seed is underground it looks like nothing is happening. It's growing the whole time.",
    "You've come a little further than you were this morning. That's enough.",
    "Starlight takes ages to get here. Things you do carefully are like that. They shine later.",
    "I didn't just bring back a souvenir. I brought back a bit of courage too. Half is yours.",
  ],
};

const zh: DiaryPools = {
  weather: {
    sunny: ["一路上都有太阳。", "是那种让所有东西都像刚洗过一样的晴天。"],
    cloudy: ["阴天，但是软软的那种。", "天空是一整床灰色的被子。我不介意。"],
    drizzle: ["下了点毛毛雨。我沿着店铺的雨棚走。", "下着小雨。所有东西闻起来都像湿湿的石头。"],
    windy: ["风很大。我的头发现在很有主见。", "风一直把我往我本来就要去的方向推。"],
    foggy: ["起雾了，所以东西是一样一样冒出来的。"],
    snowy: ["在下雪。小小的、慢慢的雪花。"],
  },
  time: {
    morning: ["我出门很早。街道还没完全醒过来。"],
    evening: ["我到的时候，光已经开始变成橙色了。"],
    night: ["外面很黑，但是是那种很舒服的黑。"],
  },
  transit: {
    2: ["我坐了公交，坐在最后一排。"],
    3: ["我坐了公交，最后一段是走过去的。"],
    4: ["我坐了电车。然后换了一辆更小的电车。"],
    5: ["路很远。我换了三次车，一次都没迷路。好吧，一次。"],
  },
  food: {
    riceball: ["我坐在一堵矮墙上吃了饭团。海苔有点软了，我喜欢这样。", "我本来想留半个饭团晚点吃，结果马上就吃掉了。"],
    sandwich: ["我站着吃完了三明治，像个大忙人。", "一只鸟看着我吃三明治。我什么都没给它。好吧，给了一点面包屑。"],
    cookies: ["我吃了一块曲奇。然后又吃了一块，确认一下味道。", "曲奇在包里被压碎了一点。还是很好吃。"],
  },
  early: ["我早一点回来了。没关系的。", "我走到一半就折回来了。剩下的部分下次还在。", "这次没走多远，但我出门了。"],
  closers: {
    back: "总之，我回来了。",
    legs: "腿有点累，是好的那种累。",
    forgot: "我差点忘了回家。",
    curious: "我想再回去看看我错过的那一部分。",
    social: "有人跟我打招呼。我也跟他打了招呼。大日子。",
    solo: "我一句话都没跟别人说。完美。",
    adventurous: "我故意走错了一个路口。",
  },
  comfort: [
    "虽然这次提前回来了，但我觉得，出发本身就已经很了不起了。",
    "路不会跑掉的。今天走到这里，下次就从这里接着走。",
    "早点回家也很好。有时候停下来，是为了下次走得更远。",
    "我发现，短短的一段路上也有好多东西可以看。你今天也一样吧。",
    "不用每次都走完全程。月亮也不是每天都圆的。",
  ],
  musing: [
    "走了很远之后我想明白了：再长的路，也是一步一步走完的。你今天也是。",
    "风景从来不催人。我们也慢慢来就好。",
    "我在路上想起你。你专心的样子，大概跟我看海的样子差不多。",
    "种子在土里的时候，看起来什么都没发生。但其实它一直在长。",
    "今天的你，比出发前的你多走了一段路。这就够了。",
    "星星的光要走很久才到这里。认真做的事情也是，会在以后亮起来。",
    "我带回来的不只是纪念品，还有一点点勇气。分你一半。",
  ],
};

export const DIARY_POOLS: Record<Locale, DiaryPools> = { en, zh };
