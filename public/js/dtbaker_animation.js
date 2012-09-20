// copyright dtbaker.com.au 

var anim_scrollers=new Array();
var parts_anim_delay = 200;
function dtbaker_anim_scroll_go(){
	var window_pos = ($(window).scrollTop()+$(window).height());
	for(var i in anim_scrollers){
		if(anim_scrollers[i].active){
			anim_scrollers[i].window_pos = window_pos;
			anim_scrollers[i].onscroll();
		}
	}
};
function anim_scroller(){
	var t = this;
	t.active=true;
	t.window_pos = 0;
	t.init_popup = function(elm){
		t.element = elm;
		t.type = 'popup';
		t.parts_anim_delay = 200; // CHANGE THIS: delay between images as they popup one after the other.
		t.anim_offset=$(t.element).offset().top+150;
		t.anim_complete=false;
		$(t.element).click(function(){
			t.reset_animation();
			setTimeout(t.do_animation,300);
		});
	};
	t.init_popout = function(elm,bgs){
		t.element = elm;
		t.type = 'popout';
		t.parts_anim_delay = 100;  // CHANGE THIS: delay between the left and right leaf appearing.
		t.anim_offset=$(t.element).offset().top+100;
		t.anim_complete=false;
		t.backgrounds = bgs;
		for(var i in t.backgrounds){
			//$(t.backgrounds[i].class,t.element).css(t.backgrounds[i].animation_from);
		}
	};
	t.reset_animation = function(){
		$('.spacer_animation_parts div',t.element).each(function(){
			$(this).animate(
				{marginTop: 400},
				300, // CHANGE THIS: speed at which the animation resets when clicked.
				'easeInOutExpo'
			);
		});
	};
	t.do_animation = function(){
		switch(t.type){
			case 'popup':
				var delay = 10;
				$('.spacer_animation_parts div',t.element).each(function(){
					var this_div = this;
					setTimeout(function(){
						$(this_div).animate(
							{marginTop: 0},
							1500,  // CHANGE THIS: time it takes for each popup animation to complete.
							'easeInOutExpo'
						);
					},delay);
					delay+=t.parts_anim_delay;
				});
				break;
			case 'popout':
				var delay = 10;
				for(var i in t.backgrounds){
					with({s:t.backgrounds[i],t:t}){
						with({s:s,t:t,delay:delay}){
							setTimeout(function(){
								$(s.class,t.element).animate(
									s.animation_to,
									s.time,
									'easeInOutExpo'
								);
							},delay);
						}
						delay+=t.parts_anim_delay;
					}
				}
				break;
		}
	};
	t.onscroll = function(){
		if(!t.anim_complete && (t.window_pos > t.anim_offset)){
			t.anim_complete=true;
			t.do_animation();
		}
	};
}