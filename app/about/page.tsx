import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于我们 — Skill Hub 中国",
  description: "Skill Hub 中国团队致力于为国内开发者提供优质的 Agent Skill 实践方案，让 AI 工具更好用、更易用。",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="container-max section-padding !py-20 md:!py-28 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            关于
            <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent"> Skill Hub 中国</span>
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            让每个开发者都能找到好用、能用、可复用的 AI 工具实践方案
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding">
        <div className="container-max max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-900">我们的使命</h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              在 AI 工具爆发的时代，开发者面临的不是工具太少，而是信息太多、选择太难。
              <br />
              Skill Hub 中国专注于聚合真实的实践案例，让你快速找到"这个工具到底怎么用、效果如何"的答案。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900">真实案例</h3>
              <p className="mt-2 text-sm text-gray-500">
                不是工具介绍，是真实的使用场景和踩坑记录
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900">持续更新</h3>
              <p className="mt-2 text-sm text-gray-500">
                每周从全网发掘优质实践，保持内容新鲜度
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900">开源共建</h3>
              <p className="mt-2 text-sm text-gray-500">
                欢迎所有开发者贡献实践案例，共建生态
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-gray-50">
        <div className="container-max max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-900">团队介绍</h2>
            <p className="mt-4 text-gray-600">
              我们是一群热爱 AI 工具的开发者，致力于让好工具被更多人发现和使用
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="rounded-xl overflow-hidden mb-6">
              <Image
                src="/images/team-photo.jpg"
                alt="Skill Hub 中国团队"
                width={1280}
                height={960}
                className="w-full h-auto"
                priority
              />
            </div>
            <p className="text-center text-gray-500 text-sm">
              Skill Hub 中国团队 · 2026
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding">
        <div className="container-max max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-extrabold text-primary-600">49+</div>
              <p className="mt-2 text-sm text-gray-500">收录 Skill</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary-600">239+</div>
              <p className="mt-2 text-sm text-gray-500">实践案例</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary-600">10K+</div>
              <p className="mt-2 text-sm text-gray-500">月访问量</p>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-primary-600">100%</div>
              <p className="mt-2 text-sm text-gray-500">开源免费</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-primary-500 to-purple-600 text-white text-center">
        <div className="container-max">
          <h2 className="text-3xl font-bold">加入我们</h2>
          <p className="mt-4 text-lg text-white/80">
            欢迎推荐优质 Skill 和实践案例，一起共建 AI 工具生态
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/xgaicoding/skill-cn/issues/new?template=create-skill.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              推荐 Skill
            </a>
            <a
              href="https://github.com/xgaicoding/skill-cn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              GitHub 仓库
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
