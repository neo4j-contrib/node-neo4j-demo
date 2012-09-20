
var link_scroll_positions = new Array();
var animating_link_click = false;
function current_link_check(){
	var window_pos = ($(window).scrollTop());
	var last_id_found = false;
	for(var i in link_scroll_positions){
		//$('#logo').append(link_scroll_positions[i].pos + ' id = ' + link_scroll_positions[i].id);
		if(link_scroll_positions[i].pos < window_pos + 300){ // && link_scroll_positions[i].pos + 400 > window_pos
			// current!
			last_id_found = link_scroll_positions[i].id;
		}
	}
	if(!animating_link_click && last_id_found){
		var r = new RegExp(last_id_found);
        $('#navigation a.slide_link').each(function(){
            var this_hash = $(this).attr('href');
            if(r.exec(this_hash)){
				$('#navigation a.slide_link').removeClass('active');
                $(this).addClass('active');
            }
        });
	}
	setTimeout(current_link_check,300);
}
$(function() {
    $('a.slide_link').bind('click',function(event){
		animating_link_click = true;
        var a = $(this);
        $('a.active').removeClass('active');
        var hash = a.attr('href');
        var current_uri = window.location.pathname;
        var link_uri = hash.match(/^(.*)#/);
        if(link_uri[1] != '' && current_uri != link_uri[1]){
            window.location.href=hash;
            event.preventDefault();
            return false;
        }
		var real_hash = hash.match(/#(.*)$/);
		hash = '#'+real_hash[1];
		
        // add the 'active' class to all the links that link to this hash
        var r = new RegExp(hash);
        $('a.slide_link').each(function(){
            var this_hash = $(this).attr('href');
            if(r.exec(this_hash)){
                //$(this).addClass('active');
                $(this).parents('li').find('.slide_link').addClass('active');
            }
        });
		if($(hash).length>0){
			$('html, body').stop().animate(
				{scrollTop: $(hash).offset().top}, 
				1500,
				'easeInOutExpo',
				function(){	
					window.location.href=hash; 
					animating_link_click = false;
				}
			);
			event.preventDefault();
			return false;
		}
        
    });
    // check if a current hash is done.
    var hash = window.location.hash;
    hash = hash.replace(/^#/,'');
    if(!hash || hash == ''){
		if(window.location.href.match(/index\.htm/i) || window.location.href.match(/\/$/)){
        	hash = 'home_page';
		}
    }
    if(hash && hash != ''){
        var r = new RegExp(hash);
        $('#navigation a.slide_link').each(function(){
            var this_hash = $(this).attr('href');
            if(r.exec(this_hash)){
                $(this).addClass('active');
            }
        });
    }
	setTimeout(function(){
	$('.main_box_wrapper').each(function(){
		link_scroll_positions.push({
			pos: $(this).offset().top, 
			id:  $(this).attr('rel') ? $(this).attr('rel') : $(this).attr('id')
		}); 
	});
	current_link_check();
	},500);
});
