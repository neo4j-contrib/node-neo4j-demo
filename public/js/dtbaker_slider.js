var dtbaker_scroller = function(id){
    var t = this;
	t.magic_width = 920;
    t.id = id;
    t.holder = $('#'+t.id)[0];
	if(typeof t.holder == 'undefined'){
		//alert('Unable to find the DIV with ID of '+t.id);
		return false;
	}
    t.current_slider_id = 1;
    t.last_offset = 0;
    t.box_offset = 0;
	t.slider_count = 0;

    t.init = function(){
        // set the width of the slider bit
        $('.slider_mover',t.holder).width(t.magic_width * $('.slider_mover > div',t.holder).length);
        // add the links:
        var x = 1;
        $('.slider_mover > div',t.holder).each(function(){
            $(this).data('slider_link_number',x);
            $('.slider_buttons li:last',t.holder).before('<li><a href="#" class="slider_jump' + ( x == 1 ? ' slider_active' : '') + '" rel="'+x+'">'+x+'</a>');
            x++;
        });
		t.slider_count = x-1;
        t.bind_click_events();
        // setup all the links and stuff.
        t.update_scroller_links();
    };
    

    t.bind_click_events = function(){
        t.last_offset = $(t.holder).offset().left;
        t.box_offset = $(t.holder).offset().left;
        $('a.slider_next',t.holder).bind('click',function(event){
            if(!$(this).hasClass('slider_disabled')){
				if(t.current_slider_id>=t.slider_count)return false;
                t.last_offset += t.magic_width;
                $('.slider_wrapper',t.holder).stop().animate({
                    scrollLeft: t.last_offset - t.box_offset
                }, 1500,'easeInOutExpo');
                t.current_slider_id++;
                t.update_scroller_links();
            }
            event.preventDefault();
            return false;
        });
        $('a.slider_prev',t.holder).bind('click',function(event){
            if(!$(this).hasClass('slider_disabled')){
				if(t.current_slider_id<=1)return false;	
                t.last_offset -= t.magic_width;
                $('.slider_wrapper',t.holder).stop().animate({
                    scrollLeft: t.last_offset - t.box_offset
                }, 1500,'easeInOutExpo');
                t.current_slider_id--;
                t.update_scroller_links();
            }
            event.preventDefault();
            return false;
        });
        $('a.slider_jump',t.holder).bind('click',function(event){
            t.current_slider_id = $(this).attr('rel');
            t.last_offset = t.box_offset + (t.magic_width*(t.current_slider_id-1));
            $('.slider_wrapper',t.holder).stop().animate({
                scrollLeft: t.last_offset - t.box_offset
            }, 1500,'easeInOutExpo');
            t.update_scroller_links();
            event.preventDefault();
        });
    };

    t.update_scroller_links = function(){
        $('a.slider_disabled',t.holder).stop().fadeTo('slow',1,function(){
														 $(this).removeClass('slider_disabled');
														 });
        if(t.current_slider_id == 1){
            $('a.slider_prev',t.holder).stop().fadeTo('slow',0,function(){
														 $(this).addClass('slider_disabled');
														 }); //.
        }else if(t.current_slider_id == t.slider_count){
            $('a.slider_next',t.holder).stop().fadeTo('slow',0,function(){
														 $(this).addClass('slider_disabled');
														 }); //.addClass('slider_disabled');
        }else{
			
		}
        $('.slider_active',t.holder).removeClass('slider_active');
        $('.slider_jump[rel='+t.current_slider_id+']',t.holder).addClass('slider_active');
    };


    t.init();

    

};


