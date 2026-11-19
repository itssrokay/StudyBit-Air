import { Stage, Phone, Row, Check, Collapse, Toast, Button, Bar, Roll, type Act } from '../../kit'
import { FileText, Layers, BookOpen, Check as Tick } from 'lucide-react'
import './learning-space.css'

// Learning Space README demo. Phone only, Android frame.
// Story in three beats, the app's own loop:
//   1. context: you shared a post from X; the "Keep this for later?" sheet is up
//   2. action: Save to read; the sheet drops and the article lands at the top of Library
//   3. result: tap the tick; it fills, the row says Read, a toast confirms
// The loop is put back by its own cause: the next share raises the sheet again,
// and the list resets unseen beneath it, so the last frame is the first.
//
// Real strings (6): Keep this for later?, How Kafka stores messages, Tech,
// Save to read, Library, Marked as read. Everything else is a line or a shape.

type S = { sheet: boolean; saved: boolean; read: boolean; toast: boolean }
const START: S = { sheet: true, saved: false, read: false, toast: false }
const REST = { x: 300, y: 420 }
const TITLE = 'How Kafka stores messages'

const script = async (a: Act<S>) => {
  await a.wait(1300)
  a.mark('save')
  await a.click('save')
  a.put({ sheet: false })
  await a.wait(380)
  a.put({ saved: true })
  await a.wait(1500)
  a.mark('tick')
  await a.click('tick')
  a.put({ read: true })
  await a.wait(260)
  a.put({ toast: true })
  await a.move(REST)
  await a.wait(2200)
  a.put({ toast: false })
  await a.wait(600)
  a.mark('next')
  // The next share: the sheet rises over the list, and the list resets beneath it
  a.put({ sheet: true })
  await a.wait(480)
  await a.snap({ saved: false, read: false })
}

function Tile({ kind }: { kind: 'article' | 'course' | 'book' }) {
  const Icon = kind === 'article' ? FileText : kind === 'book' ? BookOpen : Layers
  return (
    <span className={`lsd-tile lsd-tile--${kind}`} aria-hidden>
      <Icon size={20} strokeWidth={2} />
    </span>
  )
}

export default function LearningSpaceDemo() {
  return (
    <Stage<S>
      width={400}
      height={470}
      compact={{ below: 400, width: 358, height: 450 }}
      initial={START}
      poster={{ sheet: false, saved: true, read: true, toast: true }}
      script={script}
      cursor={{ at: REST, style: 'touch', ripple: true }}
      className="lsd"
    >
      {(s, _rect, layout) => (
        <>
          <div className="lsd-wash" />
          <Phone width={layout === 'compact' ? 318 : 340} frame="android" className="lsd-phone">
            <div className="lsd-app" data-back={s.sheet || undefined}>
              <header className="lsd-head">
                <span className="lsd-eyebrow"><Bar w={52} h={7} r={3} tone={2} /></span>
                <span className="lsd-title">Library</span>
                <span className="lsd-search"><Bar w={150} h={8} r={4} tone={2} /></span>
              </header>

              <div className="lsd-list">
                <Collapse open={s.saved} reveal="drop">
                  <Row
                    className="lsd-row lsd-row--new"
                    lead={<Tile kind="article" />}
                    title={TITLE}
                    subtitle={
                      <span className="lsd-sub">
                        <Roll>{s.read ? 'Article · Read' : 'Article · 6 min'}</Roll>
                      </span>
                    }
                  >
                    <span className="lsd-tick" data-target="tick" data-on={s.read || undefined}>
                      <Check on={s.read} size={22} />
                    </span>
                  </Row>
                </Collapse>
                <Row className="lsd-row" lead={<Tile kind="course" />} title={<Bar w={150} h={10} r={4} tone={4} />} subtitle={<Bar w={96} h={7} r={3} tone={2} />}>
                  <span className="lsd-track"><i style={{ width: '58%' }} /></span>
                </Row>
                <Row className="lsd-row" lead={<Tile kind="book" />} title={<Bar w={128} h={10} r={4} tone={4} />} subtitle={<Bar w={80} h={7} r={3} tone={2} />}>
                  <span className="lsd-track"><i style={{ width: '24%' }} /></span>
                </Row>
                <Row className="lsd-row" lead={<Tile kind="course" />} title={<Bar w={140} h={10} r={4} tone={4} />} subtitle={<Bar w={104} h={7} r={3} tone={2} />}>
                  <span className="lsd-track"><i style={{ width: '81%' }} /></span>
                </Row>
              </div>


              <Toast show={s.toast} className="lsd-toast" icon={<Tick size={16} strokeWidth={2.4} />}>
                Marked as read.
              </Toast>
            </div>

            <div className="lsd-scrim" data-show={s.sheet || undefined} />
            <section className="lsd-sheet" data-show={s.sheet || undefined} aria-label="Keep this for later?">
              <span className="lsd-grabber" />
              <div className="lsd-sheet__head">
                <span className="lsd-sheet__title">Keep this for later?</span>
                <Bar w={170} h={7} r={3} tone={2} />
              </div>
              <div className="lsd-field">
                <span className="lsd-field__label"><Bar w={34} h={6} r={3} tone={2} /></span>
                <span className="lsd-field__value">{TITLE}</span>
              </div>
              <div className="lsd-chips">
                <span className="lsd-chip lsd-chip--on"><Tick size={14} strokeWidth={2.4} />Tech</span>
                {[54, 70, 46].map((w, i) => (
                  <span key={i} className="lsd-chip"><Bar w={w} h={7} r={3} tone={3} /></span>
                ))}
              </div>
              <Button variant="primary" size="large" className="lsd-save" data-target="save" icon={<BookOpen size={16} strokeWidth={2} />}>
                Save to read
              </Button>
            </section>
          </Phone>
        </>
      )}
    </Stage>
  )
}
