"""Cut the clips to the plan, add the logo band and labels, append the end card, mux the music → ieri-oggi.mp4"""
import os, sys, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from plan import SEGS, BODY, ENDCARD, DUR
FF = os.environ.get('FFMPEG', 'ffmpeg'); FPS = 30
ins, fc, lab = [], [], []
for i, (clip, s, d, ov) in enumerate(SEGS):
    ins += ['-ss', f'{s}', '-t', f'{d + .2}', '-i', os.path.join(HERE, 'clips', f'c{clip}.mp4'), '-loop', '1', '-t', f'{d}', '-i', os.path.join(HERE, 'ov', ov + '.png')]
    vintage = clip % 2 == 0
    # vintage frames carry a rounded film border: zoom in 9 % to crop it; a slow push-in on every shot keeps the rhythm alive
    z0 = 1.09 if vintage else 1.0
    fc.append(f"[{2*i}:v]fps={FPS},trim=duration={d},setpts=PTS-STARTPTS,scale=1080:1920,"
              f"scale=w='1080*({z0}+0.03*t/{d})':h='1920*({z0}+0.03*t/{d})':eval=frame,crop=1080:1536:(iw-1080)/2:(ih-1536)*0.5,"
              f"pad=1080:1920:0:384:color=0x24272A,setsar=1[b{i}];[b{i}][{2*i+1}:v]overlay=0:0:format=auto,format=yuv420p[v{i}]")
    lab.append(f'[v{i}]')
n = len(SEGS)
ins += ['-loop', '1', '-t', f'{ENDCARD}', '-i', os.path.join(HERE, 'finale.png'), '-i', os.path.join(HERE, 'out', 'mix.wav')]
fc.append(f"[{2*n}:v]fps={FPS},scale=1080:1920,setsar=1,fade=t=in:st=0:d=0.3,format=yuv420p[ve]")
fc.append(''.join(lab) + f'[ve]concat=n={n+1}:v=1:a=0[v]')
fc.append(f"[{2*n+1}:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]")
out = os.path.join(HERE, 'ieri-oggi.mp4')
cmd = [FF, '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]', '-r', str(FPS), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', f'{DUR}', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True); print(out)
