import Link from "next/link";

const features = [
  {
    title: "Generate useful English",
    copy: "Turn a Chinese thought into easy, natural, and advanced expressions shaped by your role, location, and English style.",
  },
  {
    title: "Keep a private vault",
    copy: "Save the phrases you actually want to reuse, add notes and tags, and build a searchable personal expression library.",
  },
  {
    title: "Practise out loud",
    copy: "Record your attempt or type a transcript, compare it with the target expression, and keep a practice history.",
  },
  {
    title: "Follow a weekly plan",
    copy: "Use a 7-day plan matched to your work or study context, with progress that stays until the week is complete.",
  },
];

const audiences = ["Work meetings", "Client conversations", "Student presentations", "New Zealand and Australian workplace English"];

export default function HomePage() {
  return (
    <main className="site-page">
      <nav className="site-nav" aria-label="Website navigation">
        <Link className="site-brand" href="/">
          <span className="site-brand-mark">SV</span>
          <span>SpeakVault</span>
        </Link>
        <div className="site-nav-links">
          <a href="#product">Product</a>
          <a href="#example">Example</a>
          <Link href="/login">Sign in</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">English speaking system</p>
          <h1>Turn Chinese thoughts into workplace-ready English you can actually say.</h1>
          <p>
            SpeakVault helps you generate natural expressions, save your best phrases, practise speaking aloud, and follow a
            focused 7-day plan.
          </p>
          <div className="hero-actions">
            <Link className="site-button primary" href="/login">
              Start practising
            </Link>
            <a className="site-button secondary" href="#example">
              See example
            </a>
          </div>
        </div>

        <div className="hero-product" aria-label="SpeakVault product example">
          <div className="product-window">
            <div className="window-topline">
              <span>Chinese thought</span>
              <b>New Zealand English</b>
            </div>
            <p className="thought-card">我不是很确定这个方案是不是最优的，但我觉得我们可以先试一下。</p>
            <div className="expression-preview">
              <span>Natural</span>
              <strong>I’m not completely sure this is the best approach, but I think it’s worth trialling first.</strong>
              <p>Useful for soft disagreement in a work meeting.</p>
            </div>
            <div className="preview-metrics">
              <span>Practice</span>
              <b>92</b>
              <span>Naturalness</span>
              <b>95</b>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section" id="product">
        <div className="section-heading-wide">
          <p className="eyebrow">Product flow</p>
          <h2>A complete loop for speaking practice, not just translation.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="site-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section example-section" id="example">
        <div>
          <p className="eyebrow">Example</p>
          <h2>From one thought to a reusable speaking habit.</h2>
          <p>
            Generate expressions, save the version that sounds like you, practise it, and keep the feedback in your history.
          </p>
        </div>
        <div className="flow-list" aria-label="SpeakVault workflow">
          <div>Chinese thought</div>
          <div>3 natural expressions</div>
          <div>Saved vault phrase</div>
          <div>Speaking practice</div>
          <div>AI feedback</div>
          <div>7-day plan progress</div>
        </div>
      </section>

      <section className="site-section audience-section">
        <div>
          <p className="eyebrow">Built for</p>
          <h2>People who know what they mean, but want to sound more natural in English.</h2>
        </div>
        <div className="audience-list">
          {audiences.map((audience) => (
            <span key={audience}>{audience}</span>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>Build your private speaking vault.</h2>
        <p>Start with one Chinese thought and turn it into English you can reuse tomorrow.</p>
        <Link className="site-button primary" href="/login">
          Start practising
        </Link>
      </section>
    </main>
  );
}
