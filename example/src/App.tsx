import './index.less';

import { GlobalDnd } from 'react-global-dnd';

function App() {
  return (
    <div className="app-container">
      <GlobalDnd>
        <div data-dnd-id="hello1" data-dnd-data={{ name: 'wang' }}>
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
        </div>
        <div data-dnd-id="hello3" data-dnd-data={{ name: '3333' }}>
          hello3
        </div>
      </GlobalDnd>
    </div>
  );
}

export default App;
