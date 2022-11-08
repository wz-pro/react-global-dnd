import './index.less';

import { GlobalDnd } from '../../src/index';

function App() {
  return (
    <div className="app-container">
      <GlobalDnd>
        <div data-dnd-id="hello1" data-dnd-props={{ name: 'wang' }}>
          hello1
        </div>
        <div
          data-dnd-id="hello2"
          data-dnd-data={{ name: 'wz' }}
          style={{
            height: 100,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'red',
          }}
        >
          hello2
          <div
            style={{
              height: 50,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'gray',
            }}
          >
            hello3333
          </div>
        </div>
        <div data-dnd-id="hello3" data-dnd-props={{ name: '3333' }}>
          hello3
        </div>
        <span data-dnd-id="span">
          123123123123122222222222111
          <br />
          1111111111111111111111111111111111111111111111
        </span>
      </GlobalDnd>
    </div>
  );
}

export default App;
