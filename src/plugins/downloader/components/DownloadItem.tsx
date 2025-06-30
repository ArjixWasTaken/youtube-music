export interface DownloadItemProps {
  item: {
    status: 'queued' | 'downloading' | 'completed' | 'failed';
    title: string;
    artist: string;
    album: string;
    progress: number;
  };
}
export const DownloadItem = (props: DownloadItemProps) => {
  return (
    <div
      style={{
        'width': '100%',
        'height': '100%',
        'background-color': 'red',
        'border-radius': '1rem',
        'display': 'flex',
        'flex-direction': 'column',
        'justify-content': 'space-evenly',
        // 'align-items': 'center',
      }}
    >
      <div
        style={{
          'width': '95%',
          'margin-inline': 'auto',
          'display': 'flex',
          'flex-direction': 'row',
        }}
      >
        <div
          style={{
            'display': 'flex',
            'flex-direction': 'column',
          }}
        >
          <span>{props.item.title}</span>
          <span>
            {props.item.artist} / {props.item.album} - {props.item.status}
          </span>
        </div>
        <div
          style={{
            'display': 'flex',
            'flex-direction': 'column',
            'position': 'absolute',
            'right': '0',
            'margin-right': '5%',
          }}
        >
          <span>pause</span>
          <span>cancel</span>
        </div>
      </div>
      <progress
        style={{
          'width': '95%',
          'border-radius': '1.5rem',
          'height': '2rem',
          'margin-inline': 'auto',
        }}
        value={props.item.progress}
        max={100}
      ></progress>
    </div>
  );
};
