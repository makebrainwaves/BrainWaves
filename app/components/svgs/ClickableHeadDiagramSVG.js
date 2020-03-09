import React from 'react';

interface Props {
  channelinfo: Array<string>;
  onChannelClick: (string) => void;
}

const SvgComponent = (props: Props) => (
  <svg
    id='SignalQualityIndicator'
    data-name='SignalQualityIndicator'
    style={{ minHeight: 250, minWidth: 250 }}
    viewBox='0 0 674.44 610.29'
    {...props}
  >
    <title>Signal Quality Indicator</title>
    <g id='Head_Plot' data-name='Head Plot'>
      <circle
        cx={336.54}
        cy={334.96}
        r={212.53}
        fillOpacity='0.0'
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        strokeDasharray='16.064828872680664,22.089139938354492'
      />
      <path
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        d='M68.73 334h8'
      />
      <path
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        strokeDasharray='16.026018142700195,22.035776138305664'
        d='M98.76 334h483.79'
      />
      <path
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        d='M593.57 334h8M335.68 600.42v-8'
      />
      <path
        fillOpacity='0.0'
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        strokeDasharray='16.026018142700195,22.035776138305664'
        d='M335.68 570.39V86.6'
      />
      <path
        fillOpacity='0.0'
        stroke='#000'
        strokeLinecap='round'
        strokeMiterlimit={10}
        strokeWidth={2}
        d='M335.68 75.58v-8'
      />
      <path
        d='M282.85 72.63s24.95-42.38 51.95-42.38 51.95 42.38 51.95 42.38'
        fillOpacity='0.0'
        stroke='#000'
        strokeMiterlimit={10}
        strokeWidth={2}
      />
      <circle
        cx={335.15}
        cy={334}
        r={266.42}
        fillOpacity='0.0'
        stroke='#000'
        strokeMiterlimit={10}
        strokeWidth={2}
      />
      <path
        d='M73.11 288.57s-30 1.44-30 42.92S72.1 373 72.1 373M598 288.57s30 1.44 30 42.92S599 373 599 373'
        fillOpacity='0.0'
        stroke='#000'
        strokeMiterlimit={10}
        strokeWidth={2}
      />
    </g>
    <g
      className='channelCircle'
      id='T7'
      visibility={props.channelinfo.includes('T7') ? 'show' : 'hidden'}
      onClick={() => props.onChannelClick('T7')}
    >
      <circle cx={124.37} cy={333.72} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(111.44 341.22)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        T7
      </text>
    </g>
    <g
      className='channelCircle'
      id='FC5'
      onClick={() => props.onChannelClick('FC5')}
      visibility={props.channelinfo.includes('FC5') ? 'show' : 'hidden'}
    >
      <circle cx={178.58} cy={259.29} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(158.65 266.78)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        FC5
      </text>
    </g>
    <g
      className='channelCircle'
      id='FC6'
      onClick={() => props.onChannelClick('FC6')}
      visibility={props.channelinfo.includes('FC6') ? 'show' : 'hidden'}
    >
      <circle cx={495.58} cy={259.29} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(475.65 266.78)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        FC6
      </text>
    </g>
    <g
      className='channelCircle'
      id='F3'
      onClick={() => props.onChannelClick('F3')}
      visibility={props.channelinfo.includes('F3') ? 'show' : 'hidden'}
    >
      <circle cx={240.35} cy={241.01} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(227.8 248.5)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        F3
      </text>
    </g>
    <g
      className='channelCircle'
      id='F4'
      onClick={() => props.onChannelClick('F4')}
      visibility={props.channelinfo.includes('F4') ? 'show' : 'hidden'}
    >
      <circle cx={434.23} cy={241.01} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(421.68 248.5)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        F4
      </text>
    </g>
    <g
      className='channelCircle'
      id='AF3'
      onClick={() => props.onChannelClick('AF3')}
      visibility={props.channelinfo.includes('AF3') ? 'show' : 'hidden'}
    >
      <circle cx={269.35} cy={185.69} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(248.99 193.18)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        AF3
      </text>
    </g>
    <g
      className='channelCircle'
      id='AF4'
      onClick={() => props.onChannelClick('AF4')}
      visibility={props.channelinfo.includes('AF4') ? 'show' : 'hidden'}
    >
      <circle cx={406.36} cy={185.69} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(385.99 193.18)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        AF4
      </text>
    </g>
    <g
      className='channelCircle'
      id='M1'
      onClick={() => props.onChannelClick('M1')}
      visibility={props.channelinfo.includes('M1') ? 'show' : 'hidden'}
    >
      <circle cx={78.53} cy={401.34} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(61.92 408.83)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        M1
      </text>
    </g>
    <g
      className='channelCircle'
      id='P7'
      onClick={() => props.onChannelClick('P7')}
      visibility={props.channelinfo.includes('P7') ? 'show' : 'hidden'}
    >
      <circle cx={178.58} cy={475.91} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(165.33 483.4)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        P7
      </text>
    </g>
    <g
      className='channelCircle'
      id='O1'
      onClick={() => props.onChannelClick('O1')}
      visibility={props.channelinfo.includes('O1') ? 'show' : 'hidden'}
    >
      <circle cx={255.35} cy={531.29} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(240.18 538.79)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        O1
      </text>
    </g>
    <g
      className='channelCircle'
      id='O2'
      onClick={() => props.onChannelClick('O2')}
      visibility={props.channelinfo.includes('O2') ? 'show' : 'hidden'}
    >
      <circle cx={420.11} cy={531.29} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(404.94 538.79)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        O2
      </text>
    </g>
    <g
      className='channelCircle'
      id='P8'
      onClick={() => props.onChannelClick('P8')}
      visibility={props.channelinfo.includes('P8') ? 'show' : 'hidden'}
    >
      <circle cx={494.77} cy={475.91} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(481.51 483.4)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        P8
      </text>
    </g>
    <g
      className='channelCircle'
      id='T8'
      onClick={() => props.onChannelClick('T8')}
      visibility={props.channelinfo.includes('T8') ? 'show' : 'hidden'}
    >
      <circle cx={548.92} cy={333.72} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(535.99 341.22)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        T8
      </text>
    </g>
    <g
      className='channelCircle'
      id='M2'
      onClick={() => props.onChannelClick('M2')}
      visibility={props.channelinfo.includes('M2') ? 'show' : 'hidden'}
    >
      <circle cx={592.53} cy={400.89} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(575.92 408.38)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        M2
      </text>
    </g>
    <g
      className='channelCircle'
      id='TP10'
      onClick={() => props.onChannelClick('TP10')}
      visibility={props.channelinfo.includes('TP10') ? 'show' : 'hidden'}
    >
      <circle cx={571.87} cy={455.81} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(550.45 463.3)'
        fontSize={18}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        TP10
      </text>
    </g>
    <g
      className='channelCircle'
      id='Fpz'
      onClick={() => props.onChannelClick('Fpz')}
      visibility={props.channelinfo.includes('Fpz') ? 'show' : 'hidden'}
    >
      <circle cx={335.79} cy={121.75} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(318.56 129.24)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        <tspan letterSpacing='-.03em'>F</tspan>
        <tspan x={11.69} y={0}>
          pz
        </tspan>
      </text>
    </g>
    <g
      className='channelCircle'
      id='TP9'
      onClick={() => props.onChannelClick('TP9')}
      visibility={props.channelinfo.includes('TP9') ? 'show' : 'hidden'}
    >
      <circle cx={98.87} cy={455.81} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(79.07 463.3)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        TP9
      </text>
    </g>
    <g
      className='channelCircle'
      id='AF7'
      onClick={() => props.onChannelClick('AF7')}
      visibility={props.channelinfo.includes('AF7') ? 'show' : 'hidden'}
    >
      <circle cx={208.33} cy={166.08} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(187.97 173.57)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        AF7
      </text>
    </g>
    <g
      className='channelCircle'
      id='AF8'
      onClick={() => props.onChannelClick('AF8')}
      visibility={props.channelinfo.includes('AF8') ? 'show' : 'hidden'}
    >
      <circle cx={467.66} cy={166.08} r={30} stroke='#000' strokeMiterlimit={10} strokeWidth={2} />
      <text
        transform='translate(447.3 173.57)'
        fontSize={22}
        fontFamily='Lato-Bold,Lato'
        fontWeight={700}
        fill='#000'
      >
        AF8
      </text>
    </g>
  </svg>
);

export default SvgComponent;
