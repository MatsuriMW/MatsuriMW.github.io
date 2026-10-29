// 示例数据：一位老师、三个虚构学生（学校是真实学校，学生、成绩、课堂记录都是编的）。
// 日期按「今天往前几天」生成，demo 什么时候打开，记录都是最近两周的。
import { defaultSettings } from "./memory.js";

const day = (today, k) => new Date(new Date(today + "T00:00:00+08:00").getTime() + k * 864e5 + 8 * 3600e3).toISOString().slice(0, 10);

export function seed(today) {
    const d = (k) => day(today, k);
    const m = (id, cat, text, extra = {}) => ({ id, cat, text, qtype: "", kp: "", strength: null, evidence: "", source: "老师说", created: d(-20), updated: d(-20), history: [], ...extra });
    return {
        version: 1,
        teacher: {
            name: "示例老师",
            mems: [
                m("T1", "讲题习惯", "讲题先让学生说出选这个答案的依据，再讲正确思路"),
                m("T2", "讲题习惯", "完形先找语篇线索（转折、因果、复现），再讲词义辨析", { qtype: "完形填空" }),
                m("T3", "讲题习惯", "讲时态画时间轴，标出动作发生的先后", { qtype: "动词填空" }),
            ],
            // 课时、固定环节、作业这些结构化的设置老师在「课堂设置」里填（MAT-498），不再写成自由文本记忆；示例老师用默认值
            settings: defaultSettings(),
            settingsLog: [],
            templates: [],
            observations: [`${d(-17)} 给林小满的教案：书面表达 10% → 15%`, `${d(-10)} 给周予安的教案：书面表达 9% → 15%`, `${d(-3)} 给陈一诺的教案：书面表达 14% → 20%`],
            // 老师画像用的操作记录：三次都把书面表达调高，画像里会提议设成默认
            events: [
                { date: d(-17), kind: "mix", type: "书面表达", from: 10, to: 15, delta: 5, student: "林小满" },
                { date: d(-17), kind: "outline_gen", student: "林小满" },
                { date: d(-10), kind: "mix", type: "书面表达", from: 9, to: 15, delta: 6, student: "周予安" },
                { date: d(-10), kind: "outline_gen", student: "周予安" }, { date: d(-10), kind: "outline_edit", student: "周予安" },
                { date: d(-10), kind: "swap", type: "阅读理解", offGrade: true, student: "周予安" },
                { date: d(-3), kind: "mix", type: "书面表达", from: 14, to: 20, delta: 6, student: "陈一诺" },
                { date: d(-3), kind: "outline_gen", student: "陈一诺" },
            ],
        },
        students: [
            {
                id: "lin", name: "林小满", grade: 7, school: "东林", schoolName: "东林中学", district: "梁溪区", ownership: "公办", textbook: "新", unit: 3, attention: "容易分心",
                mems: [
                    m("S1", "薄弱点", "名词复数、形容词变副词这类词形变化常错", { qtype: "词汇运用", kp: "词形变化", strength: 0.7, evidence: "词汇运用 10 空错 4 空，都是词形", source: "课后记录", updated: d(-9) }),
                    m("S2", "薄弱点", "一般现在时第三人称单数忘加 -s", { qtype: "动词填空", kp: "一般现在时", strength: 0.55, evidence: "动词填空 3 处漏 -s", source: "课后记录", updated: d(-2) }),
                    m("S3", "学习习惯", "做阅读不划关键词，凭印象选", { source: "课后记录", updated: d(-9) }),
                    m("S4", "状态", "刚上初一，答错了会不说话，需要先鼓励"),
                    m("S5", "目标", "期中英语 110 分以上（满分 120）"),
                    m("S6", "状态", "上课 20 分钟以后容易走神，换个活动能拉回来", { source: "课后记录", updated: d(-9) }),
                ],
                logs: [
                    { date: d(-9), summary: "讲了 Unit 1–2 的词汇运用和阅读细节题", covered: ["词汇运用", "阅读理解"], errors: [{ qtype: "词汇运用", kp: "词形变化", note: "10 空错 4 空" }, { qtype: "阅读理解", kp: "细节理解", note: "没回原文找" }],
                        plan: { mix: [["阅读理解", 0.3], ["词汇运用", 0.25], ["完形填空", 0.2], ["单项选择", 0.15], ["书面表达", 0.1]] } },
                    { date: d(-2), summary: "讲了动词填空和完形，词形变化有进步", covered: ["动词填空", "完形填空", "词汇运用"], errors: [{ qtype: "动词填空", kp: "一般现在时", note: "3 处漏 -s" }, { qtype: "词汇运用", kp: "词形变化", note: "错 2 空，比上次少" }],
                        plan: { mix: [["词汇运用", 0.3], ["动词填空", 0.25], ["完形填空", 0.2], ["阅读理解", 0.25]] } },
                ],
            },
            {
                id: "zhou", name: "周予安", grade: 8, school: "省锡中", schoolName: "锡山高级中学实验学校", district: "惠山区", ownership: "公办", textbook: "新", unit: 4, attention: "一般",
                mems: [
                    m("S1", "薄弱点", "完形只看空格前后，不看下文的转折", { qtype: "完形填空", kp: "上下文逻辑", strength: 0.75, evidence: "完形 10 错 4，3 个错在转折处", source: "课后记录", updated: d(-3) }),
                    m("S2", "薄弱点", "现在完成时和一般过去时分不清", { qtype: "动词填空", kp: "现在完成时", strength: 0.6, evidence: "since / ago 句子全错", source: "课后记录", updated: d(-10) }),
                    m("S3", "已掌握", "阅读细节理解题基本不错", { qtype: "阅读理解", kp: "细节理解", source: "课后记录", updated: d(-10) }),
                    m("S4", "学习习惯", "作文爱用简单句，不会用连接词", { source: "课后记录", updated: d(-3) }),
                    m("S5", "目标", "期中想冲年级前 50"),
                ],
                logs: [
                    { date: d(-24), summary: "动词填空专项，现在完成时和一般过去时混着用", covered: ["动词填空", "词汇运用"], errors: [{ qtype: "动词填空", kp: "现在完成时", note: "8 空错 3，都是 since 句" }],
                        plan: { mix: [["动词填空", 0.35], ["词汇运用", 0.25], ["阅读理解", 0.25], ["书面表达", 0.15]] } },
                    { date: d(-17), summary: "完形和动词填空", covered: ["完形填空", "动词填空"], errors: [{ qtype: "完形填空", kp: "上下文逻辑", note: "10 错 3" }, { qtype: "动词填空", kp: "现在完成时", note: "ago 句用了完成时" }],
                        plan: { mix: [["完形填空", 0.3], ["动词填空", 0.3], ["阅读理解", 0.25], ["书面表达", 0.15]] } },
                    { date: d(-10), summary: "讲了现在完成时和阅读细节题", covered: ["动词填空", "阅读理解"], errors: [{ qtype: "动词填空", kp: "现在完成时", note: "since / ago 全错" }],
                        plan: { mix: [["动词填空", 0.3], ["阅读理解", 0.3], ["完形填空", 0.2], ["书面表达", 0.2]] } },
                    { date: d(-3), summary: "完形和作文，作文全是简单句", covered: ["完形填空", "书面表达"], errors: [{ qtype: "完形填空", kp: "上下文逻辑", note: "10 错 4，错在转折处" }, { qtype: "书面表达", kp: "连接词", note: "没有一个连接词" }],
                        plan: { mix: [["完形填空", 0.3], ["阅读理解", 0.25], ["书面表达", 0.25], ["动词填空", 0.2]] } },
                ],
            },
            {
                id: "chen", name: "陈一诺", grade: 9, school: "外国语", schoolName: "无锡外国语学校", district: "", ownership: "私立", textbook: "新", unit: 3, attention: "集中",
                mems: [
                    m("S1", "薄弱点", "推理判断题爱选原文照抄的选项", { qtype: "阅读理解", kp: "推理判断", strength: 0.7, evidence: "两次课推理题 6 错 4", source: "课后记录", updated: d(-3) }),
                    m("S2", "薄弱点", "作文不分段，结尾草草收尾", { qtype: "书面表达", kp: "篇章结构", strength: 0.55, evidence: "作文 13/20，结构扣分", source: "课后记录", updated: d(-3) }),
                    m("S3", "薄弱点", "语法填空做得少，连词和代词空常错", { qtype: "语法填空", kp: "连词", strength: 0.5, evidence: "语法填空 10 错 4", source: "课后记录", updated: d(-11) }),
                    m("S4", "学习习惯", "自学能力强，喜欢自己先订正再问"),
                    m("S5", "目标", "中考英语笔试 95 分以上（满分 100）"),
                ],
                logs: [
                    { date: d(-11), summary: "阅读推理题 + 语法填空入门", covered: ["阅读理解", "语法填空"], errors: [{ qtype: "阅读理解", kp: "推理判断", note: "3 错 2" }, { qtype: "语法填空", kp: "连词", note: "10 错 4" }],
                        plan: { mix: [["阅读理解", 0.35], ["语法填空", 0.25], ["完形填空", 0.2], ["书面表达", 0.2]] } },
                    { date: d(-3), summary: "又讲了推理题，作文写了一篇", covered: ["阅读理解", "书面表达"], errors: [{ qtype: "阅读理解", kp: "推理判断", note: "3 错 2，还是选原文照抄的" }, { qtype: "书面表达", kp: "篇章结构", note: "不分段" }],
                        plan: { mix: [["阅读理解", 0.35], ["书面表达", 0.2], ["完形填空", 0.2], ["语法填空", 0.25]] } },
                ],
            },
        ],
    };
}
